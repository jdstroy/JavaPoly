import WrapperUtil from "./WrapperUtil";

class JavaClassWrapper {

  static runProxyMethod(methodObject, argumentsList) {
    return new Promise(
      (resolve, reject) => {
        JavaClassWrapper.getClassWrapperByName(methodObject._parent._identifier).then(classWrapper => {
          classWrapper[methodObject._name](...argumentsList).then(returnValue => resolve(returnValue));
        });
      }
    );
  }

  static array2bytestr(byteArray) {
    var rv = '';
    for (var i = 0; i < byteArray.length; i++) {
      rv += String.fromCharCode(byteArray[i]);
    }
    return rv;
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
          WrapperUtil.dispatchOnJVM('CLASS_LOADING', data, (methods) => {
            const javaClassWrapper = new JavaClassWrapper(methods, clsName);
            JavaClassWrapper.cache[clsName] = javaClassWrapper;
            resolve(javaClassWrapper);
          });
        }
      }
    );
  }

  constructor(methods, clsName) {
    this.clsName = clsName;
    const wrapper = this;
    for (var i = 0; i < methods.length; i++) {
      const name = methods[i];
      this[name] = function() {
        return wrapper.runMethodWithJavaDispatching(name, Array.prototype.slice.call(arguments))
      };
    }

    function objConstructorFunction() {
      return wrapper.runConstructorWithJavaDispatching(Array.prototype.slice.call(arguments))
    }

    // Note: There is some JS magic here. This JS constructor function returns an object which is different than the one
    // being constructed (this). The returned object is a function extended with this. The idea is that `new` operator
    // can be called on the returned object to mimic Java's `new` operator.
    return Object.assign(objConstructorFunction, this);
  }

  runConstructorWithJavaDispatching(argumentsList) {
    return new Promise(
      (resolve, reject) => {
        const data = [this.clsName, argumentsList];
        WrapperUtil.dispatchOnJVM('CLASS_CONSTRUCTOR_INVOCATION', data, (returnValue) => {
          resolve(returnValue);
        });
      }
    );
  }

  runMethodWithJavaDispatching(methodName, argumentsList) {
    return new Promise(
      (resolve, reject) => {
        const data = [this.clsName, methodName, argumentsList];
        WrapperUtil.dispatchOnJVM('CLASS_METHOD_INVOCATION', data, (returnValue) => {
          resolve(returnValue);
        });
      }
    );
  }

}

export default JavaClassWrapper;
