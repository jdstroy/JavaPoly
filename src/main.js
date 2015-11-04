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

function getClass(classObject) {
  const className = classObject._identifier + ';';
  return new Promise(
    (resolve, reject) => {
      if (classObject.cache !== undefined) {
        resolve(classObject.cache);
      } else {
        console.log('LOG: Start loading class: ' + className);
        jvm.getSystemClassLoader().initializeClass(jvm.firstThread, className, cls => {
          classObject.cache = cls;
          resolve(cls);
        });
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
            console.log('LOG: Start running method: ' + method.name);
            jvm.firstThread.runMethod(method, argumentsList, (e, rv) => {
              var message = rv.fields['Ljava/lang/String;value'].array.map(
                c => { return String.fromCharCode(c); }
              ).join('');
              resolve(message);
            });
            break;
          }
        }
      });
    }
  );
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

var jvm;

var java;

function executeWithJvm(userCode) {
  loadJvm().then(jvmObject => {
    jvm = jvmObject;
    java = createEntity("Ljava", null);
    userCode();
  });
}