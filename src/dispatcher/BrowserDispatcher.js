import CommonDispatcher from './CommonDispatcher.js'

/* Used for the case when javaploy is running in Browser */
class BrowserDispatcher extends CommonDispatcher {

  constructor() {
    super();
  }

  postMessage(messageType, priority, data, callback) {
    const id = window.javaPolyIdCount++;

    this.addMessage(id, priority, messageType, data, callback);

    if (window.javaPolyCallback) {
      window.javaPolyCallback();
    }
  }

}

export default BrowserDispatcher;
