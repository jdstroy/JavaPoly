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

  getMessageType(msgId){
    // may want to delete the data after fetch
    let messageType = window.javaPolyMessageTypes[msgId];
    delete window.javaPolyMessageTypes[msgId];
    return messageType;
  }
  
  getMessageData(msgId){
    // may want to delete the data after fetch
    let messageData =  window.javaPolyData[msgId];
    delete window.javaPolyData[msgId];
    return messageData;
  }
  
  getMessageCallback(msgId){
    let callback = window.javaPolyCallbacks[msgId];
    delete window.javaPolyCallbacks[msgId];
    return callback;
  }
  
  callbackMessage(msgId, returnValue){
    let callback = window.javaPolyCallbacks[msgId];
    delete window.javaPolyCallbacks[msgId];
    callback(returnValue);
  }

}

export default CommonDispatcher;
