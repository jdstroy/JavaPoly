let javapoly;

export class JavaClassWrapper {
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

function runMethod(methodObject, argumentsList) {
  return new Promise(
    (resolve, reject) => {
      JavaClassWrapper.getClassWrapperByName(methodObject._parent._identifier).then(classWrapper => {
        classWrapper.runClassMethod(methodObject._name, argumentsList).then(returnValue => resolve(returnValue));
      });
    }
  );
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

function createEntity(name, parent) {
  // We don't now in advance is it a function or just an Object
  // But objects cannot be called, so it is a function
  const object = function() {};
  object._parent = parent;
  object._name = name;
  if (parent !== null) {
    object._identifier = (parent._name === null ? '' : parent._identifier + '.') + name;
  }
  object._call = function(thisArg, argumentsList) {
    return new Promise(
      (resolve, reject) => {
        runMethod(object, argumentsList).then(rv => resolve(rv));
      }
    );
  };

  const proxy = new Proxy(object, {
    get: (target, property) => {
      if (!target.hasOwnProperty(property)) {
        target[property] = createEntity(property, target);
      }
      return target[property];
    },
    apply: (target, thisArg, argumentsList) => {
      return target._call(thisArg, argumentsList);
    }
  });

  return proxy;
}

export function createRootEntity(javapolyObject) {
  javapoly = javapolyObject;
  return createEntity(null, null);
}