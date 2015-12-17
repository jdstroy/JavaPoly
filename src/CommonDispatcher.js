/**
 * The CommonDispatcher is used for the case when javaploy running in Browser.
 * 
 * we define the some global Object{javaPolyMessageTypes,javaPolyCallbacks,javaPolyData} 
 * for sharing args, callback function.
 * 
 */

class CommonDispatcher {

  constructor() {
    this.initDispatcher();
  }

  initDispatcher() {
    window.javaPolyEvents = [];
    window.javaPolyMessageTypes = {};
    window.javaPolyCallbacks = {};
    window.javaPolyData = {};
    window.javaPolyIdCount = 0;
  }

  installListener(){
    window.addEventListener("message", function(event) {
      if (event.origin == window.location.origin) {
        if (typeof (event.data.javapoly) == "object") {
          event.preventDefault();
          window.javaPolyEvents.push(event);

          if (window.javaPolyCallback) {
            window.javaPolyCallback();
          }
        }
      }
    });    
  }

  postMessage(messageType, data, callback){
    let id = window.javaPolyIdCount++;
    window.javaPolyMessageTypes[id] = messageType;
    window.javaPolyData[id] = data;
    window.javaPolyCallbacks[id] = callback;

    window.postMessage({ javapoly:{ messageId:""+id } }, "*");
  }
  
  getJavaPolyEventsLength(){
    return window.javaPolyEvents.length;
  }

  /**
   * pop a message and get the messageID
   */
  getMessageId(){
    let event = window.javaPolyEvents.pop();
    return event.data.javapoly.messageId;
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