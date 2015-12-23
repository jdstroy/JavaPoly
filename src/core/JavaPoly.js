import * as _ from 'underscore';
import JavaClassWrapper from './JavaClassWrapper';
import JavaObjectWrapper from './JavaObjectWrapper';
import ProxyWrapper from './ProxyWrapper';
import JavaPolyLoader from './JavaPolyLoader.js'
import BrowserDispatcher from '../dispatcher/BrowserDispatcher.js'
import WorkerCallBackDispatcher from '../dispatcher/WorkerCallBackDispatcher.js'

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
   * If empty, JavaPoly will try to automatically figure it out during initialisation.
   */

  /**
   * Javapoly worker path. null or a path, eg. build/javapoly_worker.js
   *
   * @type {String}
   * when defined not null, we will try to use the webworkers path to run the core javapoly and jvm.
   * if web worker is not supported by browser, we will just load javapoly and jvm in browser main Thread.
   */
   worker : null // 'build/javapoly_worker.js'
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
    let options = _.extend(DEFAULT_JAVAPOLY_OPTIONS, _options);

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

    // Init objects for user to make possible start to work with JavaPoly instantly
    this.initGlobalApiObjects();
  }

  // returns a promise that jvm will be ready to execute
  initJavaPoly(resolve, reject) {
    if (this.options.initOnStart === true) {
      return this.beginLoading(resolve);
    } else {
      return reject('not initialised');
    }
  }

  beginLoading(resolveDispatcherReady) {
    global.document.addEventListener('DOMContentLoaded', e => {
      let javaMimeScripts = [];
      _.each(global.document.scripts, script => {
        javaMimeScripts.push({type:script.type, src:script.src, text:script.text});
      });

      // start JVM and JavaPoly Core in Web Worker
      // only if worker option enable and browser support WebWorkers
      if (this.options.worker && global.Worker){
        this.loadJavaPolyCoreInWebWorker(javaMimeScripts,resolveDispatcherReady);
      }else{
        this.loadJavaPolyCoreInBrowser(javaMimeScripts,resolveDispatcherReady);
      }
    }, false);
  }


  loadJavaPolyCoreInBrowser(javaMimeScripts,resolveDispatcherReady) {
    this.dispatcher = new BrowserDispatcher();
    resolveDispatcherReady(this.dispatcher);

    // Otherwise Start in Browser Main Thread,
    // Ensure we have loaded the browserfs.js file before handling Java/class file
    this.loadExternalJs(this.options.browserfsLibUrl + 'browserfs.min.js').then(()=> {
      let javaPolyLoader = new JavaPolyLoader(this, javaMimeScripts,
          () => this.loadExternalJs(this.options.doppioLibUrl + 'doppio.js'));
      });
  }

  loadJavaPolyCoreInWebWorker(javaMimeScripts,resolveDispatcherReady) {
    this.dispatcher = new WorkerCallBackDispatcher(new global.Worker(this.options.worker));

    resolveDispatcherReady(this.dispatcher);

    // send JVM init request to webworker to init the jvm in javapoly workers.
    // we may need to send some options, java-mime file path to web workers.
    // and we also want to know if JVM inin success in webworkers,
    // so here we send a JVM_INIT messsage from Browser to workers to start jvm in webworkers.
    // rather then init web worker when worker init by itself.
    this.dispatcher.postMessage('JVM_INIT', 0, {options:this.options, scripts:javaMimeScripts}, (success) =>{
      if (success == true){ // JVM init success..
        console.log('JVM init success in webWorkers');
      } else {
        console.log('JVM init failed in webWorkers');
        // try to load in main thread directly when JVM init failed in WebWorkers ?

        // TODO: This won't be as simple as calling this function as messages would have been already entered into
        // dispatcher. We need to delay calling resovleDispatcherReady until the JVM success result comes back.
        // this.loadJavaPolyCoreInBrowser(javaMimeScripts, resolveDispatcherReady);
      }
    });
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

  /**
   * load js library file.
   * @param fileSrc
   * 		the uri src of the file
   * @return Promise
   * 		we could use Promise to wait for js loaded finished.
   */
  loadExternalJs(fileSrc){
  	return new Promise((resolve, reject) => {
    	let jsElm = global.document.createElement("script");
    	jsElm.type = "text/javascript";

    	if(jsElm.readyState){
    		jsElm.onreadystatechange = function(){
    			if (jsElm.readyState=="loaded" || jsElm.readyState=="complete"){
    				jsElm.onreadysteatechange=null;
    				resolve();
    			}
    		}
    	}else{
    		jsElm.onload=function(){
    			resolve();
    			// FIXME reject when timeout
    		}
    	}

    	jsElm.src = fileSrc;
    	global.document.getElementsByTagName("head")[0].appendChild(jsElm);
  	});
  };

  initGlobalApiObjects() {
    if (typeof Proxy === 'undefined') {
      console.warn('Your browser does not support Proxy, so J.java.lang.Integer.compare(42, 41) api is not available!');
    } else {
      global.window.J = ProxyWrapper.createRootEntity(null);
    }
    global.window.Java = {
      type: JavaClassWrapper.getClassWrapperByName,
      "new": (name, ...args) => {
        return Java.type(name).then((classWrapper) => new classWrapper(...args))
      }
    };
  }

  wrapJavaObject(obj, methods, nonFinalFields, finalFields) {
    return new JavaObjectWrapper(obj, methods, nonFinalFields, finalFields);
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

export default JavaPoly;
