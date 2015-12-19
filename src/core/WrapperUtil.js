class WrapperUtil {
  static dispatchOnJVM(messageType, data, callback) {
    javapoly.dispatcher.postMessage(messageType, data,callback);
  }
}

export default WrapperUtil;
