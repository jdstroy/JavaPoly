class QueueExecutor {

  constructor() {
    this.callbackQueue = [];
    this.isExecuting = false;
    this.isInitialized = false;
  }

  execute(callback) {
    this.callbackQueue.push(callback);
    this.continueExecution();
  }

  continueExecution() {
    if (! this.isInitialized) {
      // Wait until initialized
      return;
    }
    if (!this.isExecuting && this.callbackQueue.length > 0) {
      this.isExecuting = true;
      const callback = this.callbackQueue[0];
      this.callbackQueue.shift();
      callback(() => {
        this.isExecuting = false;
        this.continueExecution();
      });
    }
  }

  waitFor(eventName) {
    let self = this;
    document.addEventListener(eventName, function(e) {
      self.isInitialized = true;
      self.continueExecution();
    });
    return this;
  }
}

export default QueueExecutor;