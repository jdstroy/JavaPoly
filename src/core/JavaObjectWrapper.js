import WrapperUtil from "./WrapperUtil";

class JavaObjectWrapper {
  constructor(javaObj, methods, nonFinalFields, finalFields) {
    this._javaObj = javaObj;
    const wrapper = this;

    // Add method handlers
    for (const name of methods) {
      this[name] = function() {
        return wrapper.runMethodWithJavaDispatching(name, Array.prototype.slice.call(arguments))
      };
    }

    function methodExists(name) {
      return methods.findIndex(n => n == name) >= 0;
    }

    // Add getters and setters for non-final fields
    for (const name of nonFinalFields) {
      if (!methodExists(name)) {
        Object.defineProperty(this, name, {
          get: () => wrapper.getFieldWithJavaDispatching(name),
          set: (newValue) => { wrapper.setFieldWithJavaDispatching(name, newValue) }
        });
      }
    }

    // Add getters for final fields
    for (const name of finalFields) {
      if (!methodExists(name)) {
        Object.defineProperty(this, name, {
          get: () => wrapper.getFieldWithJavaDispatching(name)
        });
      }
    }
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
