import * as _ from 'underscore';
import JavaClassWrapper from './JavaClassWrapper';
import JavaObjectWrapper from './JavaObjectWrapper';
import ProxyWrapper from './ProxyWrapper';
import WrapperUtil from './WrapperUtil.js';
import CommonUtils from './CommonUtils.js';

/**
 * Base JavaPoly class that contains common functionality.
 */
export default class JavaPolyBase {
  constructor(_options) {
    /**
     * Object with options of JavaPoly
     * @type {Object}
     */
    this.options = _options;

    /**
     * The dispatcher for handle jvm command message
     * @Type {Object}
     */
    this.dispatcher = null;

    const dispatcherDeferred = new JavaPoly.deferred();
    this.dispatcherReady = dispatcherDeferred.promise;
    this.initJavaPoly(dispatcherDeferred.resolve, dispatcherDeferred.reject);

    const id = (++JavaPolyBase.idCount)+'';
    JavaPolyBase.instances[id] = this;
    this.getId = () => id;

  }

  static getInstance(javapolyId){
    return JavaPolyBase.instances[javapolyId];
  }

  initJavaPoly(resolve, reject) {
    if (this.options.initOnStart === true) {
      return this.beginLoading(resolve);
    } else {
      return reject('not initialised');
    }
  }

  compileJavaSource(scriptText, resolve, reject){
    const classInfo = CommonUtils.detectClassAndPackageNames(scriptText);

    const className = classInfo.class;
    const packageName = classInfo.package;

    WrapperUtil.dispatchOnJVM(
      this, "FILE_COMPILE", 10,
      [className, packageName ? packageName : "", this.options.storageDir, scriptText], resolve, reject
    )
  }

  /**
   * init the api objects of JavaPoly.
   * @param globalObject
   *   if specified, we want access this java poly instance by a global object, such as global.window.
   */
  initApiObjects(globalObject) {
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
          self.processScripts();
          if(target.hasOwnProperty(name) || mywin(name)) return true;
          if(!self.warnedAccessedGlobals) self.warnedAccessedGlobals = {};
          if(!self.warnedAccessedGlobals[name]) self.warnedAccessedGlobals[name] = false;
          return false;
        }
      };
      window.__proto__.__proto__.__proto__ = new Proxy(window.__proto__.__proto__.__proto__, proxyHandler);

      api.J = ProxyWrapper.createRootEntity(this, null);
    }
    this.processScripts();
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

    api.addClass = (data) => this.addClass(data);

    if (globalObject) {
      globalObject.Java = api.Java;
      globalObject.addClass = api.addClass;
      if (api.J)
        globalObject.J = api.J;
    }

    return api;
  }

  // data could be text string of java source or the url of remote java class/jar/source
  addClass(data){
    return new Promise((resolve, reject) => {
      const ifContainNewLine = data.indexOf('\n') >= 0;
      // If the text data contain a new line or the length > 2048, try to parse it as java souce string
      if (ifContainNewLine || data.length > 2048) {
        const classInfo = CommonUtils.detectClassAndPackageNames(data) ;
        // parse success, embedded java source code
        if (classInfo && classInfo.class ){
          return this.compileJavaSource(data, resolve, reject);
        }
      }

      return WrapperUtil.dispatchOnJVM(this, 'FS_DYNAMIC_MOUNT_JAVA', 10, {src:data}, resolve, reject);

    });
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
      Object.defineProperty(obj, name, {configurable: true, get: function(){ if(!self.proxyWarnings) self.proxyWarnings = {}; if(!self.proxyWarnings[name]) console.warn('Your browser does not support Proxy objects, so the `'+name+'` '+type+' must be accessed using Java.type(\''+(type === 'class' ? 'YourClass' : 'com.yourpackage.YourClass')+'\') instead of using the class\' fully qualified name directly from javascript.  Note that `Java.type` will return a promise for a class instead of a direct class reference.  For more info: https://javapoly.com/details.html#Java_Classes_using_Java.type()'); self.proxyWarnings[name] = true;}});
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

JavaPolyBase.idCount = 0;
JavaPolyBase.instances = {};
