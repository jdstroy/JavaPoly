class WrapperUtil {
  static dispatchOnJVM(javapoly, messageType, priority, data, callback) {
    javapoly.dispatcherReady.then(dispatcher => dispatcher.postMessage(messageType, priority, data,callback));
  }

}

export default WrapperUtil;
