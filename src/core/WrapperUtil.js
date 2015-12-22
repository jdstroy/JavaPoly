class WrapperUtil {
  static dispatchOnJVM(messageType, data, callback) {
    // TODO: Move priority decision to caller
    const priority = messageType == "FILE_COMPILE" ? 10 : 0;
    window.javapoly.dispatcherReady.then(dispatcher => dispatcher.postMessage(messageType, priority, data,callback));
  }

}

export default WrapperUtil;
