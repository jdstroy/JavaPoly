class JavaClassWrapper {

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
            javapoly.jvm.getSystemClassLoader().initializeClass(javapoly.jvm.firstThread, clsName, cls => {
              const javaClassWrapper = new JavaClassWrapper(cls, clsName);
              JavaClassWrapper.cache[clsName] = javaClassWrapper;
              resolve(javaClassWrapper);
              nextCallback();
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

  runClassMethod(methodName, argumentsList) {
    return new Promise(
      (resolve, reject) => {
        for (var i = 0; i < this.jvmClass.methods.length; i++) {
          var method = this.jvmClass.methods[i];
          // TODO make some more precise signature matching logic
          if (method.name === methodName && method.num_args === argumentsList.length) {
            javapoly.queueExecutor.execute(nextCallback => {
              javapoly.jvm.firstThread.runMethod(method, argumentsList, (e, rv) => {
                var returnValue = mapToJsObject(rv);
                resolve(returnValue);
                nextCallback();
              });
            })
            break;
          }
        }
      }
    );
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
  if (rv.cls.className === 'Ljava/lang/String;') {
    return rv.fields['Ljava/lang/String;value'].array.map(
      c => { return String.fromCharCode(c); }
    ).join('');
  }
  // Leave as it is, let user parse his object himself
  return rv;
}

export default JavaClassWrapper;
