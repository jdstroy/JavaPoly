import JavaUtilities from './JavaUtilities';

class JavaClassWrapper {

  static runMethodWithJavaUtilities(methodObject, argumentsList) {
    return JavaUtilities.runMethod(methodObject._parent._identifier, methodObject._name, argumentsList);
  }

  static runProxyMethod(methodObject, argumentsList) {
    return new Promise(
      (resolve, reject) => {
        JavaClassWrapper.getClassWrapperByName(methodObject._parent._identifier).then(classWrapper => {
          classWrapper.runClassMethod(methodObject._name, argumentsList).then(returnValue => resolve(returnValue));
        });
      }
    );
  }

  static getClassWrapperByName(clsName) {
    clsName = toByteCodeClassName(clsName);
    return new Promise(
      (resolve, reject) => {
        if (JavaClassWrapper.cache === undefined)
          JavaClassWrapper.cache = {};
        if (JavaClassWrapper.cache[clsName] !== undefined) {
          resolve(JavaClassWrapper.cache[clsName]);
        } else {
          javapoly.queueExecutor.execute(nextCallback => {
            JavaClassWrapper.dispatchOnJVM(function(thread) {
              javapoly.jvm.getSystemClassLoader().initializeClass(thread, clsName, cls => {
                const javaClassWrapper = new JavaClassWrapper(cls, clsName);
                JavaClassWrapper.cache[clsName] = javaClassWrapper;
                resolve(javaClassWrapper);
                nextCallback();
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
          return wrapper.runClassMethod(name, Array.prototype.slice.call(arguments))
        };
      } (name, this);
    }

  }

  static dispatchOnJVM(msg) {
    var id = javaPolyIdCount++;
    window.javaPolyIds[id] = msg;
    window.postMessage({ javapoly:{ messageId:""+id } }, "*")
  }

  runClassMethod(methodName, argumentsList) {
    return new Promise(
      (resolve, reject) => {

        for (var i = 0; i < this.jvmClass.methods.length; i++) {
          var method = this.jvmClass.methods[i];
          // TODO make some more precise signature matching logic
          if (method.name === methodName && method.num_args === argumentsList.length) {
            javapoly.queueExecutor.execute(nextCallback => {

              JavaClassWrapper.dispatchOnJVM(function(thread) {
                thread.runMethod(method, prepareParams(argumentsList), (e, rv) => {
                  var returnValue = mapToJsObject(rv);
                  resolve(returnValue);
                  nextCallback();
                });
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
  if (rv.cls.className === 'Ljava/lang/String;') {
    return rv.fields['Ljava/lang/String;value'].array.map(
      c => { return String.fromCharCode(c); }
    ).join('');
  } else {
    if (rv.cls.className === 'Ljava/lang/Integer;') {
      return rv;//.fields['Ljava/lang/Integer;value'];
    }
  }
  // Leave as it is, let user parse his object himself
  return rv;
}

export default JavaClassWrapper;
