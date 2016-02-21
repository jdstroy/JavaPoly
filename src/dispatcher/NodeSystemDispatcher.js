import CommonUtils from '../core/CommonUtils.js';
import CommonDispatcher from './CommonDispatcher.js'
import NodeSystemManager from '../jvmManager/NodeSystemManager.js'
import WrapperUtil from '../core/WrapperUtil.js';
import Tokens from 'csrf';
import http from 'http';
import url from 'url';

/* Used for the case when javaploy is running in node with system JVM */
export default class NodeSystemDispatcher extends CommonDispatcher {

  constructor(javapoly) {
    super(javapoly);
    this.javapoly = javapoly;

    this.heartBeatPeriodMillis = 1000;
    this.reflected = [];
    this.reflectedCount = 0;

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
      console.log("stack: " + e.stack);
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
    const mgr = new NodeSystemManager(javapoly, this.secret, this.httpPortDeffered, this.startJSServer());
    return Promise.resolve(mgr);
  }

  verifyToken(token) {
    return this.tokens.verify(this.secret, token);
  }

  postMessage(messageType, priority, data, callback) {
    const id = this.javaPolyIdCount++;

    this.handleIncomingMessage(id, priority, messageType, data, callback);
  }

  handleRequest(incoming, response) {
    const urlParts = url.parse(incoming.url, true);
    if (urlParts.pathname === "/informPort") {
      this.httpPortDeffered.resolve(incoming.headers["jvm-port"]);
      response.writeHead(200, {'Content-Type': 'text/plain' });
    } else if (urlParts.pathname === "/releaseObject") {
      const objId = incoming.headers["obj-id"];
      delete this.reflected[objId];
      response.writeHead(200, {'Content-Type': 'text/plain' });
    } else if (urlParts.pathname === "/getProperty") {
      const queryData = urlParts.query;
      const jsId = queryData.id;
      const fieldName = queryData.fieldName;
      const jsObj = this.reflected[jsId];
      const field = jsObj[fieldName];
      response.writeHead(200, {'Content-Type': 'text/plain' });
      response.write(JSON.stringify({result: this.reflect(field)}));
    }
  }

  startJSServer() {
    const _this = this;

    return new Promise((resolve, reject) => {
      const srv = http.createServer((incoming, response) => {
        if (_this.verifyToken(incoming.headers["token"])) {
          _this.handleRequest(incoming, response);
        } else {
          response.writeHead(404, {'Content-Type': 'text/plain' });
        }
        response.end();
        srv.unref();
      });
      srv.listen(0, 'localhost', () => {
        resolve(srv.address().port);
      });
    });
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

  reflect(jsObj) {
    const objType = typeof jsObj;
    if ((objType === 'function') || ((objType === 'object')) && (!jsObj._javaObj)) {
      const id = this.reflectedCount++;
      this.reflected[id] = jsObj;
      return {"jsId": id, "type": objType};
    } else {
      return jsObj;
    }
  }

  unreflect(result) {
    if ((!!result) && (typeof(result) === "object") && (!!result.jsObj)) {
      return this.reflected[result.jsObj];
    }
    return result;
  }

}
