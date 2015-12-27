/**
 * The CommonDispatcher is an abstract base class for other dispatchers.
 *
 * we define the some global Object{javaPolyMessageTypes,javaPolyCallbacks,javaPolyData}
 * for sharing args, callback function.
 *
 */

class CommonDispatcher {

  constructor() {
    // This class is abstract (can't be instantiated directly)
    if (this.constructor === CommonDispatcher) {
      throw TypeError("new of abstract class CommonDispatcher");
    }

    this.initDispatcher();
  }

  initDispatcher() {
    window.javaPolyEvents = [];
    window.javaPolyMessageTypes = {};
    window.javaPolyCallbacks = {};
    window.javaPolyData = {};
    window.javaPolyIdCount = 0;
  }

  getJavaPolyEventsLength(){
    return window.javaPolyEvents.length;
  }

  /* Add message with higher priority messages ahead of the lower priority ones */
  addMessage(id, priority) {
    // TODO: Use number instead of string for id (requires corresponding change in Main.java)

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
   * dequeue a message and get the messageID
   */
  getMessageId() {
    const id = window.javaPolyEvents.shift()[0];
    return id;
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
    callback(returnValue);
  }

}

export default CommonDispatcher;
