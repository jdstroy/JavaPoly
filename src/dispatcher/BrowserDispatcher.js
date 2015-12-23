import CommonDispatcher from './CommonDispatcher.js'

/* Used for the case when javaploy is running in Browser */
class BrowserDispatcher extends CommonDispatcher {

  constructor() {
    super();
  }

  postMessage(messageType, priority, data, callback) {
    let id = window.javaPolyIdCount++;
    window.javaPolyMessageTypes[id] = messageType;
    window.javaPolyData[id] = data;
    window.javaPolyCallbacks[id] = callback;

    this.addMessage(id, priority);

    if (window.javaPolyCallback) {
      window.javaPolyCallback();
    }
  }

}

export default BrowserDispatcher;
