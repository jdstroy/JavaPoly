import * as _ from 'underscore';
import JavaClassWrapper from './JavaClassWrapper';
import QueueExecutor from './QueueExecutor';
import ProxyWrapper from './ProxyWrapper';
import JavaPolyLoader from './JavaPolyLoader.js'

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
  browserfsLibUrl: 'browserfs/',

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
 * 2. And catch document event 'JVMReady' where event.details contains JavaPoly object that emmitted this event
 *
 * (new JavaPoly());
 * document.addEventListener('JVMReady', function(e) {
 *   var javaPoly = e.detail;
 *   // place for your jvm code
 * });
 */
class JavaPoly {
  constructor(_options) {
    let options = _.extend(DEFAULT_JAVAPOLY_OPTIONS, _options);
    /**
     * Stores referense to the BrowserFS fs-library
     * @type {BrowserFS}
     */
    this.fs = null;

    /**
     * Stores referense to the BrowserFS path-library
     * @type {[type]}
     */
    this.path = null;

    /**
     * Stores referense to the special extension for fs (for example it contains recursive mkdir)
     * @type {[type]}
     */
    this.fsext = null;

    /**
     * Array of all registered Java classes, jars, or sources
     * @type {Array}
     */
    this.scripts = [];

    /**
     * Array of all registered Java sources.
     * @type {Array}
     */
    this.sources = [];

    /**
     * Array that contains all promises that should be resolved before JVM running.
     * This array should be used for loading script
     * @type {Array<Promise>}
     */
    this.loadingHub = [];

    /**
     * Object with options of JavaPoly
     * @type {Object}
     */
    this.options = options;

    /**
     * Array that contains classpath, include the root path of class files , jar file path.
     * @type {Array}
     */
    this.classpath = [this.options.storageDir];

    /**
     * Web Worker instance which run the javapoly core and JVM
     * @Type {global.Worker}
     */
    this.worker = null;
    
    if (!this.options.javaPolyBaseUrl) {
      this.options.javaPolyBaseUrl = this.getScriptBase();
    }

    let jvmReadyPromise = this.initJavaPoly();

    this.queueExecutor = new QueueExecutor(jvmReadyPromise);

    // Init objects for user to make possible start to work with JavaPoly instantly
    this.initGlobalApiObjects();
  }

  // returns a promise that jvm will be ready to execute
  initJavaPoly() {
    if (this.options.initOnStart === true) {
      return new Promise((resolve) => { this.beginLoading(resolve) });
    } else {
      return Promise.reject('not initialised');
    }
  }

  beginLoading(resolveJVMReady) {
    global.document.addEventListener('DOMContentLoaded', e => {
      let javaMimeScripts = [];
      _.each(global.document.scripts, script => {
        javaMimeScripts.push({type:script.type, src:script.src});
      });
      this.initDispatcher();
      // start JVM and JavaPoly Core in Web Worker
      // only if worker option enable and browser support WebWorkers
      if (this.options.worker && global.Worker){
        return this.startJavaPolyWebWorker(javaMimeScripts,resolveJVMReady);
      }
      // Otherwise Start in Browser Main Thread,
      // Ensure we have loaded the browserfs.js file before handling Java/class file
      this.loadExternalJs(this.options.browserfsLibUrl + 'browserfs.min.js').then(()=> {
        new JavaPolyLoader(this, javaMimeScripts, 
            () => {this.loadingHub.push(this.loadExternalJs(this.options.doppioLibUrl + 'doppio.js'));},
            resolveJVMReady);
        });
      }, false);
    }

  startJavaPolyWebWorker(javaMimeScripts,resolveJVMReady) {
    this.worker = new global.Worker(this.options.worker);
    this.worker.addEventListener('message', e => {
      let data = e.data.javapoly;
      // JVM Init response
      if (data.messgeType == 'JVM_INIT'){
        if (data.success == true){ // JVM init success..
          console.log('JVM init success in webWorkers');
          resolveJVMReady();
        } else {
          console.log('JVM init failed in webWorkers');
          // try to load in main thread directly when JVM init failed in WebWorkers ?
          // this.loadExternalJs(this.options.doppioLibUrl+'vendor/browserfs/dist/browserfs.min.js').then(()=> {
          //
          // new JavaPolyLoader(this, javaMimeScripts,
          // () => {this.loadingHub.push(this.loadExternalJs(this.options.doppioLibUrl+'doppio.js'));},
          // resolveJVMReady);
          // });
        }
      } else {
        // JVM command(METHOD_INVOKATION/CLASS_LOADING/...) response
        let cb = window.javaPolyCallbacks[data.messageId];
        cb(data.returnValue);
      }
    }, false);

    // send JVM init request to webworker to init the jvm in javapoly workers.
    this.worker.postMessage({javapoly:{ messgeType : 'JVM_INIT', data:{options:this.options, scripts:javaMimeScripts}}});
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
      global.window.J = ProxyWrapper.createRootEntity();
    }
    global.window.Java = {
      type: JavaClassWrapper.getClassWrapperByName
    };
  }

  initDispatcher() {
    window.javaPolyMessageTypes = {};
    window.javaPolyCallbacks = {};
    window.javaPolyData = {};
    window.javaPolyIdCount = 0;
  }

}

export default JavaPoly;
