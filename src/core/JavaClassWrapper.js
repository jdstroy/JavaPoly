import Wrapper from "./Wrapper";
import WrapperUtil from "./WrapperUtil";

class JavaClassWrapper extends Wrapper {

  static runProxyMethod(javapoly, methodObject, argumentsList) {
    return new Promise(
      (resolve, reject) => {
        JavaClassWrapper.getClassWrapperByName(javapoly, methodObject._parent._identifier).then(classWrapper => {
          classWrapper[methodObject._name](...argumentsList).then(returnValue => resolve(returnValue));
        });
      }
    );
  }

  static getClassWrapperByName(javapoly, clsName) {
    return new Promise(
      (resolve, reject) => {
        if (JavaClassWrapper.cache === undefined)
          JavaClassWrapper.cache = {};
        if (JavaClassWrapper.cache[javapoly.getId()] === undefined)
          JavaClassWrapper.cache[javapoly.getId()] = {};
        const cache = JavaClassWrapper.cache[javapoly.getId()];
        if (cache[clsName] !== undefined) {
          resolve(cache[clsName]);
        } else {
          const data = [clsName];
          WrapperUtil.dispatchOnJVM(javapoly, 'CLASS_LOADING', 0, data, (result) => {
            const javaClassWrapper = new JavaClassWrapper(javapoly, result[0], result[1], result[2], clsName);
            cache[clsName] = javaClassWrapper;
            resolve(javaClassWrapper);
          }, reject);
        }
      }
    );
  }

  constructor(javapoly, methods, nonFinalFields, finalFields, clsName) {
    super(javapoly.dispatcher);
    this.clsName = clsName;
    this.javapoly = javapoly;

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
      WrapperUtil.dispatchOnJVM(this.javapoly, 'CLASS_CONSTRUCTOR_INVOCATION', 0, data, resolve, reject);
    });
  }

  runMethodWithJavaDispatching(methodName, argumentsList) {
    return new Promise((resolve, reject) => {
      const data = [this.clsName, methodName, argumentsList];
      WrapperUtil.dispatchOnJVM(this.javapoly, 'CLASS_METHOD_INVOCATION', 0, data, resolve, reject);
    });
  }

  // This is to prevent recursion, because reflectJSValue itself needs to be dispatched on the JVM.
  isReflectMethod(methodName) {
    return (methodName === "reflectJSValue") && (this.clsName == "com.javapoly.Eval");
  }

  getFieldWithJavaDispatching(name) {
    return new Promise((resolve, reject) => {
      const data = [this.clsName, name];
      WrapperUtil.dispatchOnJVM(this.javapoly, 'CLASS_FIELD_READ', 0, data, resolve, reject);
    });
  }

  setFieldWithJavaDispatching(name, value) {
    return new Promise((resolve, reject) => {
      const data = [this.clsName, name, value];
      WrapperUtil.dispatchOnJVM(this.javapoly, 'CLASS_FIELD_WRITE', 0, data, resolve, reject);
    });
  }

}

export default JavaClassWrapper;
