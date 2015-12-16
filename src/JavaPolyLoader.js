import JavaClassFile from './JavaClassFile';
import JavaArchiveFile from './JavaArchiveFile';
import JavaSourceFile from './JavaSourceFile';

const JAVA_MIME = [
  { // For compiled Java-class
    type: 'class',
    mime: ['application/java-vm'],
    srcRequired: true
  },
  { // For Java source files
    type: 'java',
    mime: ['text/x-java-source'],
    srcRequired: false
  },
  { // For JAR-files
    type: 'jar',
    mime: ['application/java-archive'],
    srcRequired: true
  }
];

/**
 * The JavaPolyLoader load the jvm and do the basic init of javapoly.
 * can be run both in Browser or WebWorker
 * 
 * The JavaPoly loader will do the following step
 *  1. init the browserFS of JavaPoly,
 *  2. run the callback {callbackBeforeStartJVM}
 *  3. load java mime scripts 
 *  4. start jvm
 * 
 * @param javapoly
 *  the javapoly instance to loader
 * @param scripts
 *  the scripts {src, type} include the java mime script to load,
 *  we will only load the script in JAVA_MIME.
 * @param callbackBeforeStartJVM
 *  the callback execute before JVM start
 * @param resolveJVMReady
 *  the callback execute when jvm start finished.
 * 
 */
class JavaPolyLoader {
  constructor(javapoly, scripts, callbackBeforeStartJVM, resolveJVMReady) {
    this.javapoly=javapoly;
    this.initBrowserFS();
    if (callbackBeforeStartJVM){
      callbackBeforeStartJVM();
    }
    this.loadScripts(scripts);
    this.initJVM().then(resolveJVMReady);
  }

  loadScripts(scripts) {
    // Load java mime files
    // _.each(scripts, script => {
    for(let script of scripts) {
      let scriptTypes = JAVA_MIME.filter(item => item.mime.some(m => m === script.type));
      // Create only when scriptTypes is only 1
      if (scriptTypes.length === 1) {
        let scriptType = scriptTypes[0].type;

        if (scriptTypes[0].srcRequired && !script.src)
          throw `An attribute 'src' should be declared for MIME-type '${script.type}'`;

        switch(scriptType) {
          case 'class':
            this.javapoly.scripts.push(new JavaClassFile(this.javapoly, script));
            break;
          case 'java':
            let javaSource = new JavaSourceFile(this.javapoly, script);
            this.javapoly.scripts.push(javaSource);
            this.javapoly.sources.push(javaSource);
            break;
          case 'jar':
            this.javapoly.scripts.push(new JavaArchiveFile(this.javapoly, script));
            break;
        }
      }
    };
  }

  /**
   * Initialization of BrowserFS
   */
  initBrowserFS(){
    let mfs = new BrowserFS.FileSystem.MountableFileSystem();
    BrowserFS.initialize(mfs);
    mfs.mount('/tmp', new BrowserFS.FileSystem.InMemory());

    // FIXME local storage can't be used in WebWorker, check if it affect anything.
    if (!window.isJavaPolyWorker)
      mfs.mount('/home', new BrowserFS.FileSystem.LocalStorage());
    
    mfs.mount('/sys', new BrowserFS.FileSystem.XmlHttpRequest('listings.json', this.javapoly.options.doppioLibUrl));
    mfs.mount('/polynatives', new BrowserFS.FileSystem.XmlHttpRequest('polylistings.json', "/natives/"));
    mfs.mount('/javapolySys', new BrowserFS.FileSystem.XmlHttpRequest('libListings.json', this.javapoly.options.javaPolyBaseUrl + "/sys/"));
    mfs.mount('/javapolySysNatives', new BrowserFS.FileSystem.XmlHttpRequest('libListings.json', this.javapoly.options.javaPolyBaseUrl + "/sysNatives/"));
    
    this.javapoly.fs = BrowserFS.BFSRequire('fs');
    this.javapoly.path = BrowserFS.BFSRequire('path');
    this.javapoly.fsext = require('./tools/fsext')(this.javapoly.fs, this.javapoly.path);
    this.javapoly.fsext.rmkdirSync(this.javapoly.options.storageDir);
  }
  
  /**
   * Return a promise that JVM will be initialised for this JavaPoly: 
   * 1. Ensure that all loading promises are finished
   * 2. Create object for JVM
   */
  initJVM() {
    return new Promise( (resolve, reject) => {
      Promise.all(this.javapoly.loadingHub).then(()=> {
        // Delete loadingHub (if somewhere else it is used so it's gonna be runtime error of that usage)
        delete this.javapoly.loadingHub;
        this.loadingHub = [];

        this.javapoly.jvm = new Doppio.VM.JVM({
          bootstrapClasspath: ['/sys/vendor/java_home/classes', "/javapolySys"],
          classpath: this.javapoly.classpath,
          javaHomePath: '/sys/vendor/java_home',
          extractionPath: '/tmp',
          nativeClasspath: ['/sys/natives', '/polynatives', "/javapolySysNatives"],
          assertionsEnabled: true
        }, (err, jvm) => {
          if (err) {
            console.log('err loading JVM:', err);
            reject();
          } else {
            // var self = this
            self.javapoly = this.javapoly;
            window.javaPolyInitialisedCallback = () => {
              // Compilation of Java sorces
              const compilationHub = this.javapoly.sources.map( (src) => src.compile() );
              Promise.all(compilationHub).then(resolve);
            }

            jvm.runClass('javapoly.Main', [], function(exitCode) {
              // Control flow shouldn't reach here under normal circumstances,
              // because Main thread keeps polling for messages.
              console.log("JVM Exit code: ", exitCode);
            });
          }
        });
      });
    });
  }
}

export default JavaPolyLoader;