class QueueExecutor {
  constructor() {
    this.callbackQueue = [];
    this.isExecuting = false;
  }

  execute(callback) {
    this.callbackQueue.push(callback);
    this.continueExecution();
  }

  continueExecution() {
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
}

export default QueueExecutor;