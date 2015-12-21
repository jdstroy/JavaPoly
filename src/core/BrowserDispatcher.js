import CommonDispatcher from './CommonDispatcher.js'

/* Used for the case when javaploy is running in Browser */
class BrowserDispatcher extends CommonDispatcher {

  constructor() {
    super();
  }

  installListener() {
    // NOP
  }

  postMessage(messageType, data, callback) {
    let id = window.javaPolyIdCount++;
    window.javaPolyMessageTypes[id] = messageType;
    window.javaPolyData[id] = data;
    window.javaPolyCallbacks[id] = callback;

    window.javaPolyEvents.push("" + id);

    if (window.javaPolyCallback) {
      window.javaPolyCallback();
    }
  }
  
  /**
   * pop a message and get the messageID
   */
  getMessageId() {
    return window.javaPolyEvents.pop();
  }
  
}

export default BrowserDispatcher;
