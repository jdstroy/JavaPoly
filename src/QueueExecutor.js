class QueueExecutor {

  constructor(jvmReadyPromise) {
    this.callbackQueue = [];
    this.isBlocked = true;
    this.waitFor(jvmReadyPromise);
  }

  execute(callback) {
    this.callbackQueue.push(callback);
    this.continueExecution();
  }

  continueExecution() {
    if ((!this.isBlocked) && (this.callbackQueue.length > 0)) {
      this.isBlocked = true;
      const callback = this.callbackQueue[0];
      this.callbackQueue.shift();
      callback(() => {
        this.isBlocked = false;
        this.continueExecution();
      });
    }
  }

  waitFor(jvmReadyPromise) {
    let self = this;
    jvmReadyPromise.then(() =>  {
      self.isBlocked = false;
      self.continueExecution();
    });
  }
}

export default QueueExecutor;
