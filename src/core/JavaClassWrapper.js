import Wrapper from "./Wrapper";
import WrapperUtil from "./WrapperUtil";

class JavaClassWrapper extends Wrapper {

  static runProxyMethod(methodObject, argumentsList) {
    return new Promise(
      (resolve, reject) => {
        JavaClassWrapper.getClassWrapperByName(methodObject._parent._identifier).then(classWrapper => {
          classWrapper[methodObject._name](...argumentsList).then(returnValue => resolve(returnValue));
        });
      }
    );
  }

  static getClassWrapperByName(clsName) {
    return new Promise(
      (resolve, reject) => {
        if (JavaClassWrapper.cache === undefined)
          JavaClassWrapper.cache = {};
        if (JavaClassWrapper.cache[clsName] !== undefined) {
          resolve(JavaClassWrapper.cache[clsName]);
        } else {
          const data = [clsName];
          WrapperUtil.dispatchOnJVM('CLASS_LOADING', 0, data, (result) => {
            const javaClassWrapper = new JavaClassWrapper(result[0], result[1], result[2], clsName);
            JavaClassWrapper.cache[clsName] = javaClassWrapper;
            resolve(javaClassWrapper);
          });
        }
      }
    );
  }

  constructor(methods, nonFinalFields, finalFields, clsName) {
    super();
    this.clsName = clsName;

    const wrapper = this;
    function objConstructorFunction() {
      return wrapper.runConstructorWithJavaDispatching(Array.prototype.slice.call(arguments))
    }

    // Note: There is some JS magic here. This JS constructor function returns an object which is different than the one
    // being constructed (this). The returned object is a function extended with this. The idea is that `new` operator
    // can be called on the returned object to mimic Java's `new` operator.
    const retFunction = Object.assign(objConstructorFunction, this);

    this.init(retFunction, methods, nonFinalFields, finalFields);

    return retFunction;
  }

  runConstructorWithJavaDispatching(argumentsList) {
    return new Promise((resolve, reject) => {
      const data = [this.clsName, argumentsList];
      WrapperUtil.dispatchOnJVM('CLASS_CONSTRUCTOR_INVOCATION', 0, data, resolve);
    });
  }

  runMethodWithJavaDispatching(methodName, argumentsList) {
    return new Promise((resolve, reject) => {
      const data = [this.clsName, methodName, argumentsList];
      WrapperUtil.dispatchOnJVM('CLASS_METHOD_INVOCATION', 0, data, resolve);
    });
  }

  getFieldWithJavaDispatching(name) {
    return new Promise((resolve, reject) => {
      const data = [this.clsName, name];
      WrapperUtil.dispatchOnJVM('CLASS_FIELD_READ', 0, data, (returnValue) => {
        resolve(returnValue);
      });
    });
  }

  setFieldWithJavaDispatching(name, value) {
    return new Promise((resolve, reject) => {
      const data = [this.clsName, name, value];
      WrapperUtil.dispatchOnJVM('CLASS_FIELD_WRITE', 0, data, (returnValue) => {
        resolve(returnValue);
      });
    });
  }

}

export default JavaClassWrapper;
