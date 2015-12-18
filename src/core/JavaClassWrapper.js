import WrapperUtil from "./WrapperUtil";

class JavaClassWrapper {

  static runProxyMethod(methodObject, argumentsList) {
    return new Promise(
      (resolve, reject) => {
        JavaClassWrapper.getClassWrapperByName(methodObject._parent._identifier).then(classWrapper => {
          classWrapper.runMethodWithJavaDispatching(methodObject._name, argumentsList).then(returnValue => resolve(returnValue));
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
          javapoly.queueExecutor.execute(nextCallback => {
            const data = [clsName];
            WrapperUtil.dispatchOnJVM('CLASS_LOADING', data, (methods) => {
              const javaClassWrapper = new JavaClassWrapper(methods, clsName);
              JavaClassWrapper.cache[clsName] = javaClassWrapper;
              resolve(javaClassWrapper);
              nextCallback();
            });
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

function prepareParams(params) {
  const result = [];
  for (var i = 0; i < params.length; i++) {
    result[i] = prepareParameterForJvm(params[i]);
  }
  return result;
}

function prepareParameterForJvm(parameter) {
  if (typeof parameter === 'number') {
    return parameter;
  } else if (typeof parameter === 'string') {
    let result = javapoly.jvm.internString(parameter);
    return result;
  } else {
    // TODO: Prepare arrays
    // const arrayClass = javapoly.jvm.bsCl.getInitializedClass(javapoly.jvm.firstThread, '[Ljava/lang/Object;')
    // const arrayConstructor = arrayClass.getConstructor(javapoly.jvm.firstThread);
    // const array = arrayConstructor(javapoly.jvm.firstThread, parameter.length);
    // for (let i = 0; i < parameter.length; i++) {
    //   array.array[i] = prepareParameterForJvm(parameter[i]);
    // }
    return parameter;
  }
}

export default JavaClassWrapper;
