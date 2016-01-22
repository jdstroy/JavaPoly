import * as _ from 'underscore';
import JavaClassWrapper from './JavaClassWrapper';
import JavaObjectWrapper from './JavaObjectWrapper';
import ProxyWrapper from './ProxyWrapper';
import BrowserDispatcher from '../dispatcher/BrowserDispatcher.js'
import WorkerCallBackDispatcher from '../dispatcher/WorkerCallBackDispatcher.js'
import WrapperUtil from './WrapperUtil.js';
import JavaParser from 'jsjavaparser';

const DEFAULT_JAVAPOLY_OPTIONS = {
  /**
   * When page is loading look for all corresponding MIME-types and create objects for Java automatically
   * @type {Boolean}
   */
  initOnStart: true,
  /**
   * Directory name that stores all class-files, jars and/or java-files
   * @type {String}
   */
  storageDir: '/tmp/data',
  /**
   * URL where we download the doppio library.
   * @type {String}
   * 1.'doppio/', download from user owner domain(${your.domain}/doppio), eg. localhost for locally test
   * 2. or a public url, eg. http://www.javapoly.com/doppio/
   */
  doppioLibUrl: '/doppio/',

  /**
   * URL where we download the BrowserFS library
   * @type {String}
   */
  browserfsLibUrl: '/browserfs/',

  /**
   * Optional: javaPolyBaseUrl
   * When defined, this is used as the base URL for loading JavaPoly data such as system classes and native functions.
   * If empty, JavaPoly will try to automatically figure it out during initialization.
   */
   javaPolyBaseUrl: null,

  /**
   * Javapoly worker path. null or a path, eg. build/javapoly_worker.js
   *
   * @type {String}
   * when defined not null, we will try to use the webworkers path to run the core javapoly and jvm.
   * if web worker is not supported by browser, we will just load javapoly and jvm in browser main Thread.
   */
   worker : null, // 'build/javapoly_worker.js'

  /**
   * Enable Java Assertions
   *
   * @type {boolean}
   */
   assertionsEnabled : false
}

/**
 * Main JavaPoly class that do all underliying job for initialization
 * Simple usage:
 * 1. Create object: (new JavaPoly());
 * 2. Use JavaPoly API classes such as `J` and `Java`.
 *
 * (new JavaPoly());
 * Java.type(....).then(() => {  } );
 */
class JavaPoly {
  constructor(_options) {
    const options = _.extend(DEFAULT_JAVAPOLY_OPTIONS, _options);

    /**
     * Object with options of JavaPoly
     * @type {Object}
     */
    this.options = options;

    /**
     * The dispatcher for handle jvm command message
     * @Type {Object}
     */
    this.dispatcher = null;

    if (!this.options.javaPolyBaseUrl) {
      this.options.javaPolyBaseUrl = this.getScriptBase();
    }

    const dispatcherDeferred = new JavaPoly.deferred();
    this.dispatcherReady = dispatcherDeferred.promise;
    this.initJavaPoly(dispatcherDeferred.resolve, dispatcherDeferred.reject);

    const id = (++JavaPoly.idCount)+'';
    JavaPoly.instances[id] = this;
    this.getId = () => id;

    // Init objects for user to make possible start to work with JavaPoly instantly
    // only bind this api to global.window for the default javapoly instance (the 1th instance, created in main.js).
    const api = this.initApiObjects(JavaPoly.idCount==1);
    return api;
  }

  static getInstance(javapolyId){
    return JavaPoly.instances[javapolyId];
  }

  initJavaPoly(resolve, reject) {
    if (this.options.initOnStart === true) {
      return this.beginLoading(resolve);
    } else {
      return reject('not initialised');
    }
  }

  beginLoading(resolveDispatcherReady) {
    // User worker only if worker option is enabled and browser supports WebWorkers
    if (this.options.worker && global.Worker){
      this.loadJavaPolyCoreInWebWorker(resolveDispatcherReady);
    }else{
      this.loadJavaPolyCoreInBrowser(resolveDispatcherReady);
    }

    global.document.addEventListener('DOMContentLoaded', e => {
      _.each(global.document.scripts, script => {
        this.processScript(script);
      });

      WrapperUtil.dispatchOnJVM(this,'META_START_JVM', 0, null);

    }, false);
  }

  processScript(script) {
    const scriptSrc = script.src;
    switch (script.type) {
      case "text/java":
        // TODO: Implement.  Should automatically figure out type and load file into JVM.
        break;

      case "application/java-archive":
        WrapperUtil.dispatchOnJVM(this, 'FS_MOUNT_JAR', 10, {src:scriptSrc});
        break;

      case "application/java-vm":
        WrapperUtil.dispatchOnJVM(this, 'FS_MOUNT_CLASS', 10, {src:scriptSrc});
        break;

      case "text/x-java-source":
        const scriptText = script.text;
        const classInfo = JavaPoly.detectClassAndPackageNames(scriptText);

        const className = classInfo.class;
        const packageName = classInfo.package;

        WrapperUtil.dispatchOnJVM(
          this, "FILE_COMPILE", 10,
          [className, packageName ? packageName : "", this.options.storageDir, scriptText]
        )
        break;

      default:
        if(script.type.toLowerCase() === 'text/java' || script.type.toLowerCase() === 'java')
          console.error('Found script tag with invalid type="'+script.type+'"; please use type="text/java"');
        break;
    }
  }

  loadJavaPolyCoreInBrowser(resolveDispatcherReady) {
    this.dispatcher = new BrowserDispatcher(this);
    resolveDispatcherReady(this.dispatcher);
  }

  loadJavaPolyCoreInWebWorker(resolveDispatcherReady) {
    this.dispatcher = new WorkerCallBackDispatcher(this.options, new global.Worker(this.options.worker));

    resolveDispatcherReady(this.dispatcher);

  }

  /* This should be called outside of Promise, or any such async call */
  getScriptBase() {
    var scriptSrc = this.getScriptSrc();
    return scriptSrc.slice(0, scriptSrc.lastIndexOf("/") + 1);
  }

  getScriptSrc() {
    if (document.currentScript) {
      return document.currentScript.src;
    } else {
      var scripts = document.getElementsByTagName('script'),
          script = scripts[scripts.length - 1];

      if (script.getAttribute.length !== undefined) {
        return script.src
      }

      return script.getAttribute('src', -1)
    }
  }

  analyzeScripts() {
    _.each(document.scripts, script => {
      if (script.type === 'text/x-java-source') {
        if(!script.analyzed) {
          script.analyzed = true;
          const classInfo = JavaPoly.detectClassAndPackageNames(script.text);
          this.createProxyForClass(global.window, classInfo.class, classInfo.package);
        }
      }
    });
  }

  /**
   * init the api objects of JavaPoly.
   * @param ifBindApiToGlobalWindow
   *   boolean, if we want access this java poly instance by global window.
   */
  initApiObjects(ifBindApiToGlobalWindow) {
    let api = {};
    api.id = this.getId();
    api.options = this.options;

    // Initialize proxies for the most common/built-in packages.
    // This will make built-in jvm packages available, since the built-ins won't have their source code in the script tags (and thus wouldn't be analyzed at parse time).
    // Most importantly, it will setup warnings when Proxy is not defined in legacy browsers (warn upon access of one of these super common packages)
    this.createProxyForClass(api, null, 'com');
    this.createProxyForClass(api, null, 'org');
    this.createProxyForClass(api, null, 'net');
    this.createProxyForClass(api, null, 'sun');
    this.createProxyForClass(api, null, 'java');
    this.createProxyForClass(api, null, 'javax');

    if (typeof Proxy !== 'undefined') {
      const self = this;

      // Setup a global Proxy(window) that keeps track of accesses to global properties.
      // Attempt to analyze any (previously unparsed) scripts, and return the Java class if it is now defined.
      // Keep track of undefined accesses, and if they become defined asynchronously by the JVM later we can warn.
      var mywin = {}.hasOwnProperty.bind(window);
      const proxyHandler = {
        has: function(target, name) {
          if(target.hasOwnProperty(name)) return true;
          self.analyzeScripts();
          if(target.hasOwnProperty(name) || mywin(name)) return true;
          if(!self.warnedAccessedGlobals) self.warnedAccessedGlobals = {};
          if(!self.warnedAccessedGlobals[name]) self.warnedAccessedGlobals[name] = false;
          return false;
        }
      };
      window.__proto__.__proto__.__proto__ = new Proxy(window.__proto__.__proto__.__proto__, proxyHandler);

      api.J = ProxyWrapper.createRootEntity(this, null);
    }
    this.analyzeScripts();
    const javaType = (clsName) => JavaClassWrapper.getClassWrapperByName(this, clsName);
    api.Java = {
      type: javaType,
      "new": (name, ...args) => {
        return javaType(name).then((classWrapper) => new classWrapper(...args))
      },
      reflect: (jsObj) => {
        return javaType("com.javapoly.Eval").then((Eval) => {
          return Eval.reflectJSValue(jsObj);
        });
      }
    };

    api.addClass = (data) => {
      const javaType = JavaPoly.detectJavaType(data);
      return new Promise((resolve, reject) => {
        if (javaType === 'jar') {
          WrapperUtil.dispatchOnJVM(this, 'FS_DYNAMIC_MOUNT_JAR', 10, {src:data}, (returnValue) => {resolve(returnValue);});
        } else if (javaType === 'class') {

        } else if (javaType === 'java' ) {

        } else {

        }
      });
    }

    if (ifBindApiToGlobalWindow) {
      global.window.Java = api.Java;
      global.window.addClass = api.addClass;
      if (api.J)
        global.window.J = api.J;
    }

    return api;
  }

  // detect the java type of a url or source data.
  static detectJavaType(data){

    // TODO if it's a url string, we need to download the file data and parse the type.
    // if it's file data, we directly parse;
    // TEMP use the extension for test.
    const nameArr = data.split('.');
    return nameArr[nameArr.length-1].toLowerCase();
  }

  /**
   * This functions parse Java source file and detects its name and package
   * @param  {String} source Java source
   * @return {Object}        Object with fields: package and class
   */
  static detectClassAndPackageNames(source) {
    let className = null, packageName = null;

    let parsedSource = JavaParser.parse(source);

    if (parsedSource.node === 'CompilationUnit') {
      for (var i = 0; i < parsedSource.types.length; i++) {
        if (JavaPoly.isPublic(parsedSource.types[i])) {
          className = parsedSource.types[i].name.identifier;
          break;
        }
      }
      if (parsedSource.package) {
        packageName = JavaPoly.getPackageName(parsedSource.package.name);
      }
    }

    return {
      package: packageName,
      class:   className
    }
  }

  static isPublic(node) {
    if (node.modifiers) {
      for (var i = 0; i < node.modifiers.length; i++) {
        if (node.modifiers[i].keyword === 'public') {
          return true;
        }
      }
    }
    return false;
  }

  static getPackageName(node) {
    if (node.node === 'QualifiedName') {
      return JavaPoly.getPackageName(node.qualifier) + '.' + node.name.identifier;
    } else {
      return node.identifier;
    }
  }

  createProxyForClass(obj, classname, packagename) {
    let name = null;
    let type = null;
    if (packagename != null) {
      name = packagename.split('.')[0];
      type = 'package';
    } else {
      name = classname;
      type = 'class';
    }

    if (typeof Proxy !== 'undefined') {
      obj[name] = ProxyWrapper.createRootEntity(this, name);
    }
    else {
      const self = this;
      Object.defineProperty(obj, name, {configurable: true, get: function(){ if(!self.proxyWarnings) self.proxyWarnings = {}; if(!self.proxyWarnings[name]) console.warn('Your browser does not support Proxy objects, so the `'+name+'` '+type+' must be accessed using Java.type(\''+(type === 'class' ? 'YourClass' : 'com.yourpackage.YourClass')+'\') instead of using the class\' fully qualified name directly from javascript.  Note that `Java.type` will return a promise for a class instead of a direct class reference.  For more info: http://javapoly.com/details.html#Java_Classes_using_Java.type()'); self.proxyWarnings[name] = true;}});
    }
  }

  wrapJavaObject(obj, methods, nonFinalFields, finalFields) {
    return new JavaObjectWrapper(this, obj, methods, nonFinalFields, finalFields);
  }

  unwrapJavaObject(obj) {
    // TODO: is a better check possible using prototypes
    if (obj._javaObj) {
      return obj._javaObj;
    } else {
      return null;
    }
  }

  // Utility function to create a deferred promise
  static deferred() {
    this.promise = new Promise(function(resolve, reject) {
      this.resolve = resolve;
      this.reject = reject;
    }.bind(this));
    Object.freeze(this);
    return this;
  }

}

JavaPoly.idCount = 0;
JavaPoly.instances = {};
global.window.JavaPoly = JavaPoly;

export default JavaPoly;
