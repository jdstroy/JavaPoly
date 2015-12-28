class WrapperUtil {
  static dispatchOnJVM(messageType, priority, data, callback) {
    window.javapoly.dispatcherReady.then(dispatcher => dispatcher.postMessage(messageType, priority, data,callback));
  }

}

export default WrapperUtil;
