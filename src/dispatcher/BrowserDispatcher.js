import CommonDispatcher from './CommonDispatcher.js'

/* Used for the case when javaploy is running in Browser */
class BrowserDispatcher extends CommonDispatcher {

  constructor() {
    super();
  }

  postMessage(messageType, priority, data, callback) {
    const id = window.javaPolyIdCount++;

    this.handleJVMMessage(id, priority, messageType, data, callback);
  }

}

export default BrowserDispatcher;
