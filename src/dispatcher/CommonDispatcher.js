/**
 * The CommonDispatcher is an abstract base class for other dispatchers.
 *
 * we define the some global Object{javaPolyMessageTypes,javaPolyCallbacks,javaPolyData}
 * for sharing args, callback function.
 *
 */

class CommonDispatcher {

  constructor(javapoly) {
    // This class is abstract (can't be instantiated directly)
    if (this.constructor === CommonDispatcher) {
      throw TypeError("new of abstract class CommonDispatcher");
    }

    this.options = javapoly.options;

    this.initDispatcher(javapoly);
  }

  initDispatcher(javapoly) {
    this.javaPolyEvents = [];
    this.javaPolyMessageTypes = {};
    this.javaPolyCallbacks = {};
    this.javaPolyData = {};
    this.javaPolyIdCount = 0;

    this.javaPolyCallback = null;

    this.doppioManager = this.initDoppioManager(javapoly);
  }

  handleIncomingMessage(id, priority, messageType, data, callback) {
    if (messageType.startsWith("META_")) {
      this.handleMetaMessage(id, priority, messageType, data, callback);
    } else if (messageType.startsWith("FS_")) {
      this.handleFSMessage(id, priority, messageType, data, callback);
    } else {
      this.handleJVMMessage(id, priority, messageType, data, callback);
    }
  }

  // JVM messages are added to a queue and dequed from the JVM main thread.
  handleJVMMessage(id, priority, messageType, data, callback) {

    this.addMessage(id, priority, messageType, data, callback);

    if (this.javaPolyCallback){
      this.javaPolyCallback();
    }
  }

  // FS messages are processed immediately
  handleFSMessage(id, priority, messageType, data, callback) {
    switch(messageType) {
      case "FS_MOUNT_JAVA":
        this.doppioManager.then(dm => dm.mountJava(data.src));
        break;
      case "FS_DYNAMIC_MOUNT_JAVA":
        this.doppioManager.then(dm => dm.dynamicMountJava(data.src).then((msg) => {
          if (msg === "OK") {
            callback({success:true, returnValue: 'Add Class success'});
          } else {
            console.log("Failed to mount java file:", msg, data);
            callback({success:false, returnValue: 'Add Class fail'});
          }
        }, (msg) => callback({success:false, cause:{stack:[msg]}})));
        break;
      default:
        console.log("FS TODO", messageType);
        break;
    }
  }

  // Meta messages are processed immediately
  handleMetaMessage(id, priority, messageType, data, callback) {
    switch(messageType) {
      case "META_START_JVM":
        this.doppioManager.then(dm => dm.initJVM());
        break;
      default:
        console.log("META TODO", messageType);
        break;
    }
  }

  /* Add message with higher priority messages ahead of the lower priority ones */
  addMessage(id, priority, messageType, data, callback) {
    this.javaPolyMessageTypes[id] = messageType;
    this.javaPolyData[id] = data;
    this.javaPolyCallbacks[id] = callback;

    const queue = this.javaPolyEvents;
    const pos = queue.findIndex(e => e[1] < priority);
    const value = [""+id, priority];
    if (pos < 0) {
      // insert at end
      queue.push(value);
    } else {
      // insert at position
      queue.splice(pos, 0, value);
    }
  }

  /**
   * dequeue a message and get the messageID. Returns undefined when there is no message in the queue.
   */
  getMessageId() {
    const msg = this.javaPolyEvents.shift();
    if (msg) {
      const id = msg[0];
      return id;
    } else {
      return undefined;
    }
  }

  getMessageType(msgId){
    // may want to delete the data after fetch
    const messageType = this.javaPolyMessageTypes[msgId];
    delete this.javaPolyMessageTypes[msgId];
    return messageType;
  }

  getMessageData(msgId){
    // may want to delete the data after fetch
    const messageData =  this.javaPolyData[msgId];
    delete this.javaPolyData[msgId];
    return messageData;
  }

  getMessageCallback(msgId){
    const callback = this.javaPolyCallbacks[msgId];
    delete this.javaPolyCallbacks[msgId];
    return callback;
  }

  setJavaPolyCallback(callback){
    this.javaPolyCallback = callback;
  }

  callbackMessage(msgId, returnValue){
    const callback = this.javaPolyCallbacks[msgId];
    delete this.javaPolyCallbacks[msgId];
    if (callback) {
      callback(returnValue);
    }
  }

}

export default CommonDispatcher;
