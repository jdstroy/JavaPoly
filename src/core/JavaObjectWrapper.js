import WrapperUtil from "./WrapperUtil";

class JavaObjectWrapper {
  constructor(javaObj, methods) {
    this._javaObj = javaObj;
    const wrapper = this;

    // Add method handlers
    for (const name of methods) {
      this[name] = function() {
        return wrapper.runMethodWithJavaDispatching(name, Array.prototype.slice.call(arguments))
      };
    }
  }

  runMethodWithJavaDispatching(methodName, argumentsList) {
    return new Promise((resolve, reject) => {
      const data = [this._javaObj, methodName, argumentsList];
      WrapperUtil.dispatchOnJVM('OBJ_METHOD_INVOCATION', data, (returnValue) => {
        resolve(returnValue);
      });
    });
  }

}

export default JavaObjectWrapper;
