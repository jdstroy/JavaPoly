class JavaPolyExecutor {
  /**
   * Constructor of JavaPolyExecutor
   * @param  {JavaPoly}   javapoly parent JavaPoly instance
   * @param  {Function} cb       callback-function that runs when JavaPolyExecutor is loaded
   */
  constructor(javapoly, cb) {
    /**
     * Thread of executor. Usually this thread is waiting for jobs.
     * @type {[type]}
     */
    this.thread = null;

    /**
     * JVM object
     */
    this.jvm = javapoly.jvm;

    /**
     * Array that stores queue of tasks for Executor
     * @type {Array}
     */
    this.queue = [];

    /**
     * Event listener for notifyIsLoaded message
     * @type {Function}
     */
    this.onNotifyIsLoaded = cb;

    // starting class com.javapoly.Executor that process tasks and return results
    this.jvm.runClass('com.javapoly.Executor', [], function(exitCode) {
      if (exitCode !== 0) {
        throw 'Unable to start "com.javapoly.Executor"';
      }
    });
  }

  runStaticMethod(className, methodName, ...args) {
    if (this.thread) {
      // return value for current method
    } else {
      // await for event that thread is ready
    }
    queue.push({type: 'runStaticMethod', className, methodName, args});
  }
}

export default JavaPolyExecutor;
