class WrapperUtil {
  static dispatchOnJVM(javapoly, messageType, priority, data, resolve, reject) {
    javapoly.dispatcherReady.then(dispatcher => dispatcher.postMessage(messageType, priority, data, (response) => {
      if (response.success) {
        resolve(response.returnValue);
      } else {
        reject(response.cause);
      }
    }));
  }

}

export default WrapperUtil;
