// This entire object is exported. Feel free to define private helper functions above it.
var ThreadStatus = DoppioJVM.VM.Enums.ThreadStatus;

registerNatives({
  /**
   * Executor is a class for executing Java code from JS. 
   * This class has main() method which runs awaitForTask(), methodRun() and returnTaskResult() in loop.
   * # awaitForTask() awaits for new task from JS that should be runned
   * # methodRun() parse META-data that returned from awaitForTask() and runs static Java method
   * # returnTaskResult() returns result value from runned method to JS.
   */
  'com/javapoly/Executor': {

    'awaitForTask()[Ljava/lang/Object;': function(thread) {
      thread.setStatus(ThreadStatus.ASYNC_WAITING);
    },

    'returnTaskResult(Ljava/lang/Object;)V': function(thread, arg0) {
      return {};
      //thread.throwNewException('Ljava/lang/UnsatisfiedLinkError;', 'Native method not implemented.');
    },

    'notifyIsLoaded()V': function(thread) {
      thread.jvm.javapoly.executor.thread = thread;
      thread.jvm.javapoly.executor.onNotifyIsLoaded();
    }

  }
});
