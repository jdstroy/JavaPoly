let jvm = null;

function callInQueue(callback) {
  if (typeof callInQueue.callbackQueue === 'undefined') {
    callInQueue.callbackQueue = [];
  }
  callInQueue.callbackQueue.push(callback);
  asyncExecute();
}

// Makes asynchronous calls synchronized
function asyncExecute() {
  if (typeof asyncExecute.isExecuting === 'undefined') {
    asyncExecute.isExecuting = false;
  }
  if (!asyncExecute.isExecuting && callInQueue.callbackQueue.length > 0) {
    asyncExecute.isExecuting = true;
    var callback = callInQueue.callbackQueue[0];
    callInQueue.callbackQueue.shift();
    callback(() => {
      asyncExecute.isExecuting = false;
      asyncExecute();
    });
  }
}

export function getClassWrapperByName(clsName) {
  clsName = toByteCodeClassName(clsName);
  return new Promise(
    (resolve, reject) => {
      if (getClassWrapperByName.cache === undefined)
        getClassWrapperByName.cache = {};
      if (getClassWrapperByName.cache[clsName] !== undefined) {
        resolve(getClassWrapperByName.cache[clsName]);
      } else {
        callInQueue(nextCallback => {
          let systemClassLoader = jvm.getSystemClassLoader();
          console.log(clsName);
          console.log(systemClassLoader);
          if (systemClassLoader) {
            systemClassLoader.initializeClass(jvm.firstThread, clsName, cls => {
              const javaClassWrapper = new JavaClassWrapper(cls, clsName);
              getClassWrapperByName.cache[clsName] = javaClassWrapper;
              resolve(javaClassWrapper);
              nextCallback();
            });
          }
        })
      }
    }
  );
}

function toByteCodeClassName(clsName) {
  return 'L' + clsName.replace(/\./g, '/') + ';';
}

class JavaClassWrapper {
  constructor(jvmClass, clsName) {
    this.jvmClass = jvmClass;
    this.clsName = clsName;
    for (var i = 0; i < jvmClass.methods.length; i++) {
      var name = jvmClass.methods[i].name;
      this[name] = function(name, wrapper) {
        return function() {
          return wrapper.runClassMethod(name, Array.prototype.splice.call(arguments, 1))
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
            callInQueue(nextCallback => {
              jvm.firstThread.runMethod(method, argumentsList, (e, rv) => {
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
      getClassWrapperByName(methodObject._parent._identifier).then(classWrapper => {
        classWrapper.runClassMethod(methodObject._name, argumentsList).then(returnValue => resolve(returnValue));
      });
    }
  );
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
  if (name === 'root') {
    object._identifier = 'root';
  } else {
    object._identifier = (parent._identifier === 'root' ? '' : parent._identifier + '.') + name;
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

export function createRootEntity(javapoly) {
  jvm = javapoly.jvm;
  return createEntity('root', null);
}