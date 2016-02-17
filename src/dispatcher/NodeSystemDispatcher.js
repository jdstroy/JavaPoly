import CommonUtils from '../core/CommonUtils.js';
import CommonDispatcher from './CommonDispatcher.js'
import NodeSystemManager from '../jvmManager/NodeSystemManager.js'
import WrapperUtil from '../core/WrapperUtil.js';
import Tokens from 'csrf';
import http from 'http';

/* Used for the case when javaploy is running in node with system JVM */
export default class NodeSystemDispatcher extends CommonDispatcher {

  constructor(javapoly) {
    super(javapoly);

    this.heartBeatPeriodMillis = 1000;

    const _this = this;
    this.count = 0;
    this.terminating = false;
    const process = require('process');
    process.on('beforeExit', () => {
      // console.log("before exit: ", _this.count);
      if (!_this.terminating) {
        WrapperUtil.dispatchOnJVM(javapoly, 'TERMINATE', 0, [], (willTerminate) => {
          _this.count++;
          _this.terminating = willTerminate;
          if (!willTerminate) {
            setTimeout(() => { }, 500);    // breathing space to avoid busy polling. TODO: Exponential backoff with ceiling
          } else {
            WrapperUtil.dispatchOnJVM(javapoly, 'TERMINATE_NOW', 0, [], (willTerminate) => { });
          }
        });
      }
    });

    process.on('exit', () => {
      // console.log("node process Exit");
      _this.terminating = true;
    });

    process.on('SIGINT', () => {
      _this.terminating = true;
      WrapperUtil.dispatchOnJVM(javapoly, 'TERMINATE_NOW', 0, [], (willTerminate) => { });
    });

    process.on('uncaughtException', (e) => {
      console.log("Uncaught exception: " + e);
      _this.terminating = true;
      WrapperUtil.dispatchOnJVM(javapoly, 'TERMINATE_NOW', 0, [], (willTerminate) => { });
    });


    const timer = setInterval(() => {
      if (!_this.terminating) {
        WrapperUtil.dispatchOnJVM(javapoly, 'HEARTBEAT', 0, [], (willTerminate) => { });
      } else {
        clearInterval(timer);
      }
    }, this.heartBeatPeriodMillis);

    timer.unref();

  }

  initDoppioManager(javapoly) {
    this.httpPortDeffered = new CommonUtils.deferred();
    this.tokens = new Tokens();
    this.secret = this.tokens.secretSync()
    const mgr = new NodeSystemManager(javapoly, this.secret, this.httpPortDeffered, this);
    return Promise.resolve(mgr);
  }

  verifyToken(token) {
    return this.tokens.verify(this.secret, token);
  }

  postMessage(messageType, priority, data, callback) {
    const id = this.javaPolyIdCount++;

    this.handleIncomingMessage(id, priority, messageType, data, callback);
  }

  handleJVMMessage(id, priority, messageType, data, callback) {
    const _this = this;
    const thisDispatcher = this;
    const token = this.tokens.create(this.secret)
    this.javaPolyCallbacks[id] = callback;
    this.httpPortDeffered.promise.then((port) => {
      const msgObj = {id: ""+id, priority: priority, messageType: messageType, data: data, token: token};
      const msg = JSON.stringify(msgObj);
      const requestOptions = {
        port: port,
        hostname: "localhost",
        path:"/message",
        headers: {"Content-Length": msg.length},
        agent: false
      };
      const req = http.request(requestOptions, (res) => {
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          const msg = JSON.parse(chunk);
          if (thisDispatcher.verifyToken(msg.token)) {
            thisDispatcher.callbackMessage(msg.id, msg.result);
          } else {
            console.log("Invalid CSRF token, ignoring message");
          }
        });
      });
      req.on('error', () => {
        if (_this.terminating) {
          // Expected
        } else {
          throw new Error("Unexpected error in request");
        }
      });
      req.write(msg);
      req.end();
    });
  }

}
