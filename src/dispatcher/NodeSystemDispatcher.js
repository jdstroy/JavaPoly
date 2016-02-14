import CommonUtils from '../core/CommonUtils.js';
import CommonDispatcher from './CommonDispatcher.js'
import NodeSystemManager from '../jvmManager/NodeSystemManager.js'
import WrapperUtil from '../core/WrapperUtil.js';
// import ShutdownHandler from '../shutdownHandler.js';
import Tokens from 'csrf';
import http from 'http';

/* Used for the case when javaploy is running in node with system JVM */
export default class NodeSystemDispatcher extends CommonDispatcher {

  constructor(javapoly) {
    super(javapoly);

    const _this = this;
    this.count = 0;
    this.terminating = false;
    const process = require('process');
    process.on('beforeExit', () => {
      console.log("before exit: ", _this.count);
      if (!_this.terminating) {
        WrapperUtil.dispatchOnJVM(javapoly, 'TERMINATE', 0, [], (willTerminate) => {
          _this.count++;
          _this.terminating = willTerminate;
          if (!willTerminate) {
            setTimeout(() => { }, 500);    // breathing space to avoid busy polling. TODO: Exponential backoff with ceiling
          }
        });
      }
    });
    process.on('SIGINT', () => {
      WrapperUtil.dispatchOnJVM(javapoly, 'TERMINATE_NOW', 0, [], (willTerminate) => {
        _this.terminating = true;
      });
    });

    // this.wscPromise = new CommonUtils.deferred();
    // new ShutdownHandler({});
  }

  /*
  initWSServer() {
    const thisDispatcher = this;
    return new Promise((resolve) => {
      const http = require('http');

      // Create an HTTP server
      const srv = http.createServer();
      srv.listen(0, "localhost", () => {
        const address = srv.address();
        const WebSocketServer = require('ws').Server;
        const wss = new WebSocketServer({ server: srv });
        process.on("shutdown", () => {
          wss.close();
          console.log("WSS closed");
        });

        wss.on('connection', (wsc) => {
          process.on("shutdown", () => {
            wsc.close();
            console.log("WSC closed");
          });
          wsc.on('message', function incoming(message) {
            const msg = JSON.parse(message);
            if (thisDispatcher.tokens.verify(thisDispatcher.secret, msg.token)) {
              thisDispatcher.callbackMessage(msg.id, msg.result);
            } else {
              console.log("Invalid CSRF token, ignoring message");
            }
          });
          thisDispatcher.wscPromise.resolve(wsc);

          // wsc.send(JSON.stringify({id:""+10, msg:'something'}));
        });
        resolve(address);
      });
    });

  }
  */

  initDoppioManager(javapoly) {
    /*
    return this.initWSServer().then(address => {
      return new NodeSystemManager(javapoly, address.port, this.secret);
    });
    */
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
        // console.log(`STATUS: ${res.statusCode}`);
        // console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          const msg = JSON.parse(chunk);
          if (thisDispatcher.verifyToken(msg.token)) {
            thisDispatcher.callbackMessage(msg.id, msg.result);
          } else {
            console.log("Invalid CSRF token, ignoring message");
          }
        });
/*
        res.on('end', () => {
          console.log("result end");
        });
*/
      });
      req.write(msg);
      req.end();
    });
  }

}
