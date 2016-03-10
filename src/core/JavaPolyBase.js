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

    const dispatcherDeferred = new CommonUtils.deferred();
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
    if(globalObject) {
      this.createProxyForClass(globalObject, null, 'com');
      this.createProxyForClass(globalObject, null, 'org');
      this.createProxyForClass(globalObject, null, 'net');
      this.createProxyForClass(globalObject, null, 'sun');
      this.createProxyForClass(globalObject, null, 'java');
      this.createProxyForClass(globalObject, null, 'javax');
    }

    if (typeof Proxy !== 'undefined') {
      api.J = ProxyWrapper.createRootEntity(this, null);
      if(globalObject) globalObject.J = api.J;
    } else {
      this.defineProxyWarning(api, 'J', 'accessor');
      if(globalObject) this.defineProxyWarning(globalObject, 'J', 'accessor');
    }

    this.processScripts();
    const javaType = (clsName) => JavaClassWrapper.getClassWrapperByName(this, clsName);
    api.Java = {
      type: javaType,
      "new": (name, ...args) => {
        return javaType(name).then((classWrapper) => new classWrapper(...args))
      }
      /* TODO: use the reflect command
      reflect: (jsObj) => {
        return javaType("com.javapoly.Main").then((Main) => {
          return Main.reflectJSValue(jsObj);
        });
      }
      */
    };

    api.addClass = (data) => this.addClass(data);

    if (globalObject) {
      globalObject.Java = api.Java;
      globalObject.addClass = api.addClass;
    }

    return api;
  }

  static addClass(data) {
    return (JavaPolyBase.idCount === 0 ? new this() : JavaPolyBase.instances['1']).addClass(data);
  }

  static type(clsName) {
    return (JavaPolyBase.idCount === 0 ? new this() : JavaPolyBase.instances['1']).type(clsName);
  }

  // data could be text string of java source or the url of remote java class/jar/source
  addClass(data){
    return new Promise((resolve, reject) => {
      // try to parse it as java souce string
      const classInfo = CommonUtils.detectClassAndPackageNames(data) ;
      // parse success, embedded java source code
      if (classInfo && classInfo.class ){
        return this.compileJavaSource(data, resolve, reject);
      }

      // try add remote java/class/jar file
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
      this.defineProxyWarning(obj, name, type);
    }
  }

  defineProxyWarning(obj, name, type) {
    var self = this;
    Object.defineProperty(obj, name, {configurable: true, get: function(){ if(!self.proxyWarnings) self.proxyWarnings = {}; if(!self.proxyWarnings[name]) console.error('Your browser does not support Proxy objects, so the `'+name+'` '+type+' must be accessed using Java.type(\''+(type === 'class' ? 'YourClass' : 'com.yourpackage.YourClass')+'\') instead of using the class\' fully qualified name directly from javascript.  Note that `Java.type` will return a promise for a class instead of a direct class reference.  For more info: https://javapoly.com/details.html#Java_Classes_using_Java.type()'); self.proxyWarnings[name] = true;}});
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

}

JavaPolyBase.idCount = 0;
JavaPolyBase.instances = {};
