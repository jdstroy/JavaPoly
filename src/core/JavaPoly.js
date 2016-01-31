import * as _ from 'underscore';
import JavaPolyBase from './JavaPolyBase';
import BrowserDispatcher from '../dispatcher/BrowserDispatcher.js'
import WorkerCallBackDispatcher from '../dispatcher/WorkerCallBackDispatcher.js'
import WrapperUtil from './WrapperUtil.js';
import CommonUtils from './CommonUtils.js';

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
   * 2. or a public url, eg. https://www.javapoly.com/doppio/
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
class JavaPoly extends JavaPolyBase {
  constructor(_options) {
    const options = _.extend(DEFAULT_JAVAPOLY_OPTIONS, _options);
    if (!options.javaPolyBaseUrl) {
      options.javaPolyBaseUrl = JavaPoly.getScriptBase();
    }

    super(options);

    // Init objects for user to make possible start to work with JavaPoly instantly
    // only bind this api to global.window for the default javapoly instance (the 1th instance, created in main.js).
    return this.initApiObjects(JavaPolyBase.idCount === 1 ? global.window : undefined);
  }

  beginLoading(resolveDispatcherReady) {
    // User worker only if worker option is enabled and browser supports WebWorkers
    if (this.options.worker && global.Worker){
      this.loadJavaPolyCoreInWebWorker(resolveDispatcherReady);
    }else{
      this.loadJavaPolyCoreInBrowser(resolveDispatcherReady);
    }

    global.document.addEventListener('DOMContentLoaded', e => {

      this.processScripts();
      WrapperUtil.dispatchOnJVM(this,'META_START_JVM', 0, null);

    }, false);
  }

  processScripts() {
    _.each(global.document.scripts, script => {
      this.processScript(script);
    });
  }

  processScript(script) {
    if(script.type.toLowerCase() !== 'text/java' && script.type.toLowerCase() !== 'application/java')
      return;

    if(script.analyzed) return;

    script.analyzed = true;

    //embedded source code
    if (script.text){
      const classInfo = CommonUtils.detectClassAndPackageNames(script.text);
      this.createProxyForClass(global.window, classInfo.class, classInfo.package);
      return this.compileJavaSource(script.text);
    }

    if (!script.src){
      console.warning('please specify the text or src of text/java');
      return;
    }

    return WrapperUtil.dispatchOnJVM(this, 'FS_MOUNT_JAVA', 10, {src:script.src});
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
  static getScriptBase() {
    var scriptSrc = JavaPoly.getScriptSrc();
    return scriptSrc.slice(0, scriptSrc.lastIndexOf("/") + 1);
  }

  static getScriptSrc() {
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

}

global.window.JavaPoly = JavaPoly;

export default JavaPoly;
