import CommonUtils from '../core/CommonUtils.js';
import CommonDispatcher from './CommonDispatcher.js'
import NodeSystemManager from '../jvmManager/NodeSystemManager.js'

/* Used for the case when javaploy is running in node with system JVM */
export default class NodeSystemDispatcher extends CommonDispatcher {

  constructor(javapoly) {
    super(javapoly);
    this.wscPromise = new CommonUtils.deferred();
  }

  initWSServer(andThen) {
    const thisDispatcher = this;
    return new Promise((resolve) => {
      const http = require('http');

      // Create an HTTP server
      const srv = http.createServer();
      srv.listen(0, "localhost", () => {
        const address = srv.address();
        const WebSocketServer = require('ws').Server;
        const wss = new WebSocketServer({ server: srv });

        wss.on('connection', (wsc) => {
          wsc.on('message', function incoming(message) {
            const msg = JSON.parse(message);
            thisDispatcher.callbackMessage(msg.id, msg.result);
          });
          thisDispatcher.wscPromise.resolve(wsc);

          // wsc.send(JSON.stringify({id:""+10, msg:'something'}));
        });
        resolve(address);
      });
    });

  }

  initDoppioManager(javapoly) {
    return this.initWSServer().then(address => {
      return new NodeSystemManager(javapoly, address.port);
    });
  }

  postMessage(messageType, priority, data, callback) {
    const id = this.javaPolyIdCount++;

    this.handleIncomingMessage(id, priority, messageType, data, callback);
  }

  // JVM messages are added to a queue and dequed from the JVM main thread.
  handleJVMMessage(id, priority, messageType, data, callback) {
    this.javaPolyCallbacks[id] = callback;
    this.wscPromise.promise.then((wsc) => {
      const msgObj = {id: ""+id, priority: priority, messageType: messageType, data: data};
      const msg = JSON.stringify(msgObj);
      wsc.send(msg);
    });
  }

}
