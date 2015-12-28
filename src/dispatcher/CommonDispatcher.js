/**
 * The CommonDispatcher is an abstract base class for other dispatchers.
 *
 * we define the some global Object{javaPolyMessageTypes,javaPolyCallbacks,javaPolyData}
 * for sharing args, callback function.
 *
 */

class CommonDispatcher {

  constructor(options) {
    // This class is abstract (can't be instantiated directly)
    if (this.constructor === CommonDispatcher) {
      throw TypeError("new of abstract class CommonDispatcher");
    }

    this.options = options;

    this.initDispatcher();
  }

  initDispatcher() {
    window.javaPolyEvents = [];
    window.javaPolyMessageTypes = {};
    window.javaPolyCallbacks = {};
    window.javaPolyData = {};
    window.javaPolyIdCount = 0;

    this.doppioManager = this.initDoppioManager(this.options);
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

    if (window.javaPolyCallback) {
      window.javaPolyCallback();
    }
  }

  // FS messages are processed immediately
  handleFSMessage(id, priority, messageType, data, callback) {
    switch(messageType) {
      case "FS_MOUNT_JAR":
        this.doppioManager.then(dm => dm.mountJar(data.src));
        break;
      case "FS_MOUNT_CLASS":
        this.doppioManager.then(dm => dm.mountClass(data.src));
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
    self.javaPolyMessageTypes[id] = messageType;
    self.javaPolyData[id] = data;
    self.javaPolyCallbacks[id] = callback;

    const queue = window.javaPolyEvents;
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
    const msg = window.javaPolyEvents.shift();
    if (msg) {
      const id = msg[0];
      return id;
    } else {
      return undefined;
    }
  }

  getMessageType(msgId){
    // may want to delete the data after fetch
    const messageType = window.javaPolyMessageTypes[msgId];
    delete window.javaPolyMessageTypes[msgId];
    return messageType;
  }

  getMessageData(msgId){
    // may want to delete the data after fetch
    const messageData =  window.javaPolyData[msgId];
    delete window.javaPolyData[msgId];
    return messageData;
  }

  getMessageCallback(msgId){
    const callback = window.javaPolyCallbacks[msgId];
    delete window.javaPolyCallbacks[msgId];
    return callback;
  }

  callbackMessage(msgId, returnValue){
    const callback = window.javaPolyCallbacks[msgId];
    delete window.javaPolyCallbacks[msgId];
    if (callback) {
      callback(returnValue);
    }
  }

}

export default CommonDispatcher;
