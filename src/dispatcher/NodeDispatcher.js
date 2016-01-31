import CommonDispatcher from './CommonDispatcher.js'
import NodeDoppioManager from '../doppioManager/NodeDoppioManager.js'

/* Used for the case when javaploy is running in Browser */
export default class NodeDispatcher extends CommonDispatcher {

  constructor(javapoly) {
    super(javapoly);
  }

  initDoppioManager(javapoly) {
    return Promise.resolve(new NodeDoppioManager(javapoly));
  }

  postMessage(messageType, priority, data, callback) {
    const id = this.javaPolyIdCount++;

    this.handleIncomingMessage(id, priority, messageType, data, callback);
  }

}
