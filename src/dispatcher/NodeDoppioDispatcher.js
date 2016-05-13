"use strict";
import CommonDispatcher from './CommonDispatcher.js'
import NodeDoppioManager from '../jvmManager/NodeDoppioManager.js'

/* Used for the case when javaploy is running in node with doppio */
export default class NodeDoppioDispatcher extends CommonDispatcher {

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

  reflect(jsObj) {
    return jsObj;
  }

  unreflect(result) {
    if ((!!result) && (typeof(result) === "object") && (!!result._javaObj)) {
      const className = result._javaObj.getClass().className;
      if (className === "Lcom/javapoly/reflect/DoppioJSObject;" || className === "Lcom/javapoly/reflect/DoppioJSPrimitive;") {
        return result._javaObj["com/javapoly/reflect/DoppioJSValue/rawValue"];
      }
    }
    return result;
  }

}
