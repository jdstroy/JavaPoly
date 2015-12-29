import Wrapper from "./Wrapper";
import WrapperUtil from "./WrapperUtil";

class JavaObjectWrapper extends Wrapper {
  constructor(javaObj, methods, nonFinalFields, finalFields) {
    super();
    this._javaObj = javaObj;
    this.init(this, methods, nonFinalFields, finalFields);
  }

  getFieldWithJavaDispatching(name) {
    return new Promise((resolve, reject) => {
      const data = [this._javaObj, name];
      WrapperUtil.dispatchOnJVM('OBJ_FIELD_READ', 0, data, (returnValue) => {
        resolve(returnValue);
      });
    });
  }

  setFieldWithJavaDispatching(name, value) {
    return new Promise((resolve, reject) => {
      const data = [this._javaObj, name, value];
      WrapperUtil.dispatchOnJVM('OBJ_FIELD_WRITE', 0, data, (returnValue) => {
        resolve(returnValue);
      });
    });
  }

  runMethodWithJavaDispatching(methodName, argumentsList) {
    return new Promise((resolve, reject) => {
      const data = [this._javaObj, methodName, argumentsList];
      WrapperUtil.dispatchOnJVM('OBJ_METHOD_INVOCATION', 0, data, (returnValue) => {
        resolve(returnValue);
      });
    });
  }

}

export default JavaObjectWrapper;
