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

function getClass(classObject) {
  const className = classObject._identifier + ';';
  return new Promise(
    (resolve, reject) => {
      if (classObject.cache !== undefined) {
        resolve(classObject.cache);
      } else {
        callInQueue(nextCallback => {
          jvm.getSystemClassLoader().initializeClass(jvm.firstThread, className, cls => {
            classObject.cache = cls;
            resolve(cls);
            nextCallback();
          });
        })
      }
    }
  );
}

function runMethod(methodObject, argumentsList) {
  return new Promise(
    (resolve, reject) => {
      getClass(methodObject._parent).then(cls => {
        for (var i = 0; i < cls.methods.length; i++) {
          var method = cls.methods[i];
          if (method.name === methodObject._name && method.num_args === argumentsList.length) {
            // TODO parse different type of arguments and return type
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
  object._identifier = (parent === null ? "" : parent._identifier + "/") + name;
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

function createEntity(name, parent) {
  // We don't now in advance is it a function or just an Object
  // But objects cannot be called, so it is a function
  const object = function() {};
  object._parent = parent;
  object._name = name;
  object._identifier = (parent === null ? "" : parent._identifier + "/") + name;
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

function createRootEntity(javapoly) {
  jvm = javapoly.jvm;
  return createEntity("Ljava", null);
}

export default createRootEntity;