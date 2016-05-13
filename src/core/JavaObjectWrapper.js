"use strict";
import Wrapper from "./Wrapper";
import WrapperUtil from "./WrapperUtil";

class JavaObjectWrapper extends Wrapper {
  constructor(javapoly, javaObj, methods, nonFinalFields, finalFields) {
    super(javapoly.dispatcher);
    this.javapoly = javapoly;
    this._javaObj = javaObj;
    this.init(this, methods, nonFinalFields, finalFields);
  }

  getFieldWithJavaDispatching(name) {
    return new Promise((resolve, reject) => {
      const data = [this._javaObj, name];
      WrapperUtil.dispatchOnJVM(this.javapoly, 'OBJ_FIELD_READ', 0, data, resolve, reject);
    });
  }

  setFieldWithJavaDispatching(name, value) {
    return new Promise((resolve, reject) => {
      const data = [this._javaObj, name, value];
      WrapperUtil.dispatchOnJVM(this.javapoly, 'OBJ_FIELD_WRITE', 0, data, resolve, reject);
    });
  }

  isReflectMethod(methodName) {
    return false;
  }

  runMethodWithJavaDispatching(methodName, argumentsList) {
    return new Promise((resolve, reject) => {
      const data = [this._javaObj, methodName, argumentsList];
      WrapperUtil.dispatchOnJVM(this.javapoly, 'OBJ_METHOD_INVOCATION', 0, data, resolve, reject);
    });
  }

}

export default JavaObjectWrapper;
