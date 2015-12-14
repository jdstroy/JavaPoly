import JavaUtilities from './JavaUtilities';

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
            JavaClassWrapper.dispatchOnJVM(function(thread, continuation) {
              javapoly.jvm.getSystemClassLoader().initializeClass(thread, toByteCodeClassName(clsName), cls => {
                const javaClassWrapper = new JavaClassWrapper(cls, clsName);
                JavaClassWrapper.cache[clsName] = javaClassWrapper;

                resolve(javaClassWrapper);
                nextCallback();

                continuation();
              });
            });
          })
        }
      }
    );
  }

  constructor(jvmClass, clsName) {
    this.jvmClass = jvmClass;
    this.clsName = clsName;
    for (var i = 0; i < jvmClass.methods.length; i++) {
      var name = jvmClass.methods[i].name;
      this[name] = function(name, wrapper) {
        return function() {
          return wrapper.runMethodWithJavaDispatching(name, Array.prototype.slice.call(arguments))
        };
      } (name, this);
    }
  }

  static dispatchOnJVM(msg, data) {
    var id = window.javaPolyIdCount++;
    window.javaPolyIds[id] = msg;
    window.javaPolyData[id] = data;
    window.postMessage({ javapoly:{ messageId:""+id } }, "*")
  }

  runMethodWithJavaDispatching(methodName, argumentsList) {
    return new Promise(
      (resolve, reject) => {
        const data = [this.clsName, methodName, argumentsList];
        const callback = (returnValue) => { resolve(returnValue); };
        JavaClassWrapper.dispatchOnJVM(callback, data);
      }
    );
  }


  // Method invocation moved to Java land
  // In below case messaging between Java and JS seems meaningless as it continues to invoke methods in js with new doppio api
  // So it is like an alternative way that still uses explicit Java function calls
  // And that is not recommended by doppio (as we figured out)
  runClassMethod(methodName, argumentsList) {
    return new Promise(
      (resolve, reject) => {

        var self = this;
        for (var i = 0; i < this.jvmClass.methods.length; i++) {
          var method = this.jvmClass.methods[i];
          // TODO make some more precise signature matching logic
          if (method.name === methodName && method.parameterTypes.length === argumentsList.length) {
            javapoly.queueExecutor.execute(nextCallback => {

              JavaClassWrapper.dispatchOnJVM(function(thread, continuation) {
                var cons = self.jvmClass.getConstructor(thread);
                var handleReturn = (e, rv) => {
                  var returnValue = mapToJsObject(rv);
                  resolve(returnValue);
                  nextCallback();
                  continuation();
                };

                // TODO: check if the need for an if condition changes per https://github.com/plasma-umass/doppio/issues/395
                if (method.parameterTypes.length == 0) {
                  cons[method.fullSignature](thread, handleReturn);
                } else {
                  cons[method.fullSignature](thread, prepareParams(argumentsList), handleReturn);
                }
              });

            })
            break;
          }
        }
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

function toByteCodeClassName(clsName) {
  return 'L' + clsName.replace(/\./g, '/') + ';';
}

function mapToJsObject(rv) {
  if (typeof rv !== 'object') {
    // It is basic types, no need to convert it additionally
    return rv;
  }
  if (Array.isArray(rv)) {
    return rv;
  }
  if (rv["getClass"]) {
    var cls = rv.getClass();
    if (cls.className === 'Ljava/lang/String;') {
      return JavaClassWrapper.array2bytestr(rv['java/lang/String/value'].array);
    } else {
      if (cls.className === 'Ljava/lang/Integer;') {
        return rv;//.fields['Ljava/lang/Integer;value'];
      }
    }
  }
  // Leave as it is, let user parse his object himself
  return rv;
}

export default JavaClassWrapper;
