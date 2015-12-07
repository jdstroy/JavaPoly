class QueueExecutor {

  constructor(jvmReadyPromise) {
    this.callbackQueue = [];
    this.isExecuting = false;
    this.isInitialized = false;
    this.waitFor(jvmReadyPromise);
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

  waitFor(jvmReadyPromise) {
    let self = this;
    jvmReadyPromise.then(() =>  {
      self.isInitialized = true;
      self.continueExecution();
    });
  }
}

export default QueueExecutor;
