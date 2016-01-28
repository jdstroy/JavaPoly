class WrapperUtil {
  static dispatchOnJVM(javapoly, messageType, priority, data, resolve, reject) {
    javapoly.dispatcherReady.then(dispatcher => dispatcher.postMessage(messageType, priority, data, (response) => {
      if (response.success) {
        if (resolve)
          resolve(response.returnValue);
      } else {

        /* This function is added here, because it is not possible to serialise functions across web-worker sandbox */
        response.cause.printStackTrace = function() {
          for (const se in response.cause.stack) {
            console.warn(response.cause.stack[se]);
          }
        }
        if (reject)
          reject(response.cause);
      }
    }));
  }

}

export default WrapperUtil;
