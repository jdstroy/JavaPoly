function loadJvm() {
  return new Promise(
    (resolve, reject) => {
      // create a virtual file system for frontend JS
      var mfs = new BrowserFS.FileSystem.MountableFileSystem();
      var fs = BrowserFS.BFSRequire('fs');
      BrowserFS.initialize(mfs);

      // store files of folder /tmp in memory
      mfs.mount('/tmp', new BrowserFS.FileSystem.InMemory());
      // store files of folder /home in LocalStorage
      mfs.mount('/home', new BrowserFS.FileSystem.LocalStorage());
      // retrieve files of folder /sys via XmlHttpRequest according records of doppio/listings.json
      // all this file-paths will be prefixed with 'doppio/'
      mfs.mount('/sys', new BrowserFS.FileSystem.XmlHttpRequest('listings.json', 'doppio/'));

      // initialise JVM with next settings
      new doppio.JVM({
        bootstrapClasspath: ['/sys/vendor/java_home/classes'],
        classpath: ['/sys'],
        javaHomePath: '/sys/vendor/java_home',
        extractionPath: '/tmp',
        nativeClasspath: ['/sys/src/natives'],
        assertionsEnabled: false
      }, (err, jvmObject) => {
        resolve(jvmObject);
      });
    }
  );
}

function getJvm() {
  if (typeof this.jvm === 'undefined') {
    this.jvm = null;
    this.jvmIsLoading = false;
    this.promisesQueue = [];
  }
  return new Promise(
    (resolve, reject) => {
      if (jvm != null) {
        resolve(jvm);
      } else {
        promisesQueue.push(jvm => resolve(jvm));
        if (! jvmIsLoading) {
          jvmIsLoading = true;
          loadJvm().then(jvmObject => {
            jvm = jvmObject;
            for (var i = 0; i < promisesQueue.length; i++) {
              promisesQueue[i](jvm);
            }
          });
        }
      }
    }
  );
}

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
        getJvm().then(jvm =>
          callInQueue(nextCallback => {
            jvm.getSystemClassLoader().initializeClass(jvm.firstThread, className, cls => {
              classObject.cache = cls;
              resolve(cls);
              nextCallback();
            });
          })
        );
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
            getJvm().then(jvm =>
              callInQueue(nextCallback => {
                jvm.firstThread.runMethod(method, argumentsList, (e, rv) => {
                  var returnValue = mapToJsObject(rv);
                  resolve(returnValue);
                  nextCallback();
                });
              })
            );
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

var java = createEntity("Ljava", null);

// TODO: in the future it should use web worker if doppio is thread safe and does not contain any race condition
function _processJavaCode(code) {
  return eval(code);
}

function _processScripts() {
  // we need to process scripts in order
  var scripts = _findScriptTags('text/java');

  for (var s of scripts) {
    if (s.src) {
      //TODO: load java from file in src param
    } else if (s.textContent) {
      // process content inside script tag
      _processJavaCode(s.textContent);
    }
  }

}

function _findScriptTags(type) {
  // console.log(document.querySelector('script[type="text/java"]').textContent);
  return window.document.querySelectorAll('script[type="' + type + '"]');
}

(function() {
  // find all script tags and handle them approprietaly
  _processScripts();

})();
