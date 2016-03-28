import CommonUtils from '../core/CommonUtils.js';
import WrapperUtil from '../core/WrapperUtil.js'

const classfile = require('./../tools/classfile.js');

/**
 * The DoppioManager manages the JVM and filesystem.
 * It can be run in Browser or WebWorker.
 * It assumes that the .js for BrowserFS and Doppio is already loaded.
 */
class DoppioManager {
  constructor(javapoly) {
    this.javapoly = javapoly;

    this.fs = null;
    
    /**
     * It's a MountableFileSystem that contains XHR mounted file systems.
     * It's needed for loading JAR-files without loading and resaving it.
     */
    this.xhrdirs = new BrowserFS.FileSystem.MountableFileSystem();

    /**
     * Stores referense to the special extension for fs (for example it contains recursive mkdir)
     * @type {[type]}
     */
    this.fsext = null;

    /**
     * Array that contains classpath, include the root path of class files , jar file path.
     * @type {Array}
     */
    this.classpath = [this.getOptions().storageDir];

    this.mountHub = [];

    this.initBrowserFS();
  }

  getOptions() {
    return this.javapoly.options;
  }

  /**
   * Initialization of BrowserFS
   */
  initBrowserFS(){
    const mfs = new BrowserFS.FileSystem.MountableFileSystem();
    BrowserFS.initialize(mfs);
    mfs.mount('/tmp', new BrowserFS.FileSystem.InMemory());

    // FIXME local storage can't be used in WebWorker, check if it affect anything.
    if (!this.javapoly.isJavaPolyWorker) {
      mfs.mount('/home', new BrowserFS.FileSystem.LocalStorage());
    }

    const options = this.getOptions();

    this.bfsReady = new Promise((resolve) => {
      CommonUtils.xhrRetrieve(options.doppioLibUrl + "/listings.json", "json").then(doppioListings => {
        CommonUtils.xhrRetrieve(options.javaPolyBaseUrl + "/listings.json", "json").then(javapolyListings => {
          mfs.mount('/sys', new BrowserFS.FileSystem.XmlHttpRequest(doppioListings, options.doppioLibUrl));
          mfs.mount('/javapoly', new BrowserFS.FileSystem.XmlHttpRequest(javapolyListings, options.javaPolyBaseUrl));          
          mfs.mount('/xhrdirs', this.xhrdirs);

          this.fs = BrowserFS.BFSRequire('fs');
          this.path = BrowserFS.BFSRequire('path');
          this.fsext = require('./../tools/fsext')(this.fs, this.path);
          this.fsext.rmkdirSync(options.storageDir);
          BrowserFS.install(this);
          this.installStreamHandlers();
          resolve();
        });
      });
    });

  }

  mountJava(src) {
    const Buffer = global.BrowserFS.BFSRequire('buffer').Buffer;
    const options = this.getOptions();
    this.bfsReady.then(() => {
      this.mountHub.push(
        new Promise((resolve, reject) => {
          if (CommonUtils.isZipFile(src)) {
            return this.mountFileViaXHR(src).then(
              (jarStorePath) => {this.classpath.push(jarStorePath); resolve();},
              reject );
          } else {
            // remote file, we need to download the file data of that url and parse the type.
            CommonUtils.xhrRetrieve(src, "arraybuffer").then(fileData => {
              const fileDataBuf = new Buffer(fileData);

              // remote java class/jar file
              if (CommonUtils.isClassFile(fileDataBuf)){
                //return WrapperUtil.dispatchOnJVM(this, 'FS_MOUNT_CLASS', 10, {src:script.src});
                return this.writeRemoteClassFileIntoFS(src, fileDataBuf).then(resolve, reject);
              } else if (CommonUtils.isZipFile(fileDataBuf)) {
                //return WrapperUtil.dispatchOnJVM(this, 'FS_MOUNT_JAR', 10, {src:script.src});
                return this.writeRemoteJarFileIntoFS(src, fileDataBuf).then(
                  (jarStorePath) => { this.classpath.push(jarStorePath); resolve(); },
                  reject );
              }

              // remote java source code file
              const classInfo = CommonUtils.detectClassAndPackageNames(fileDataBuf.toString());
              if (classInfo && classInfo.class ){
                const className = classInfo.class;
                const packageName = classInfo.package;
                return WrapperUtil.dispatchOnJVM(
                    this.javapoly, "FILE_COMPILE", 10,
                    [className, packageName ? packageName : "", options.storageDir, fileDataBuf.toString()], resolve, reject
                  );
              }

              console.log('Unknown java file type', src);
              reject('Unknown java file type'+src);
            }, () => {
              console.log('URL Not Found', src);
              reject('Unknown java file type'+src);
            });            
          }          
        })
      );
    });
  }

  dynamicMountJava(src) {
    const Buffer = global.BrowserFS.BFSRequire('buffer').Buffer;
    const options = this.getOptions();
    return new Promise((resolve, reject) => {
      if (CommonUtils.isZipFile(src)) {
        return this.mountFileViaXHR(src).then(
          (jarStorePath) => WrapperUtil.dispatchOnJVM(this.javapoly, 'JAR_PATH_ADD', 10, ['file://'+jarStorePath], resolve, reject) ,
          reject );
      } else {
        // remote file, we need to download the file data of that url and parse the type.
        CommonUtils.xhrRetrieve(src, "arraybuffer").then(fileData => {
          const fileDataBuf = new Buffer(fileData);

          // remote java class/jar file
          if (CommonUtils.isClassFile(fileDataBuf)){
            //return WrapperUtil.dispatchOnJVM(this, 'FS_MOUNT_CLASS', 10, {src:script.src});
            return this.writeRemoteClassFileIntoFS(src, fileDataBuf).then(resolve, reject);
          } else if (CommonUtils.isZipFile(fileDataBuf)){
            //return WrapperUtil.dispatchOnJVM(this, 'FS_MOUNT_JAR', 10, {src:script.src});
            return this.writeRemoteJarFileIntoFS(src, fileDataBuf).then(
              (jarStorePath) => WrapperUtil.dispatchOnJVM(this.javapoly, 'JAR_PATH_ADD', 10, ['file://'+jarStorePath], resolve, reject) ,
              reject);
          }

          // remote java source code file
          const classInfo = CommonUtils.detectClassAndPackageNames(fileDataBuf.toString()) ;
          if (classInfo && classInfo.class ){
            const className = classInfo.class;
            const packageName = classInfo.package;
            return WrapperUtil.dispatchOnJVM(
                this.javapoly, "FILE_COMPILE", 10,
                [className, packageName ? packageName : "", options.storageDir, fileDataBuf.toString()], resolve, reject
              );
          }

          console.log('Unknown java file type', src);
          reject('Unknown java file type'+src);
        }, () => {
          console.log('URL Not Found', src);
          reject('Unknown java file type'+src);
        });
      }
    })
  }
  
  mountFileViaXHR(src) {
    const options = this.getOptions();
    
    return new Promise((resolve, reject) => {
      const fileName = this.path.basename(src);

      let listingObject = {}; listingObject[fileName] = null;
      
      let lastSlash = 0; 
      for(let ti = 0; (ti = src.indexOf('/', lastSlash + 1)) > 0; lastSlash = ti) ;
      
      const mountPoint = new BrowserFS.FileSystem.XmlHttpRequest(listingObject, src.substr(0,lastSlash));
      
      const dirName = this.path.join(src.replace(/[\///\:]/gi, ''));
      this.xhrdirs.mount('/' + dirName, mountPoint);
      
      resolve(this.path.join('/xhrdirs', dirName, fileName));
    });
  }

  writeRemoteJarFileIntoFS(src,jarFileData) {
    const Buffer = global.BrowserFS.BFSRequire('buffer').Buffer;
    const options = this.getOptions();
    return new Promise((resolve, reject) => {
      const jarName = this.path.basename(src);
      const jarStorePath = this.path.join(options.storageDir, jarName);
      // store the .jar file to $storageDir
      this.fs.writeFile(jarStorePath, jarFileData, (err) => {
        if (err) {
          console.error(err.message);
          reject(err.message);
        } else {
          // add .jar file path to the URL of URLClassLoader
          //this.classpath.push(jarStorePath);

          //need to pass the path, will add that path to ClassLoader of Main.java
          resolve(jarStorePath);
        }
      });
    });
  }

  writeRemoteClassFileIntoFS(src, classFileData){
    const Buffer = global.BrowserFS.BFSRequire('buffer').Buffer;
    const options = this.getOptions();
    return new Promise((resolve, reject) => {
      const classFileInfo = classfile.analyze(classFileData);
      const className   = this.path.basename(classFileInfo.this_class);
      const packageName = this.path.dirname(classFileInfo.this_class);

      this.fsext.rmkdirSync(this.path.join(options.storageDir, packageName));

      this.fs.writeFile(this.path.join(options.storageDir, classFileInfo.this_class + '.class'),
        classFileData, (err) => {
          if (err) {
            console.error(err.message);
            reject(err.message);
          } else {
            resolve();
          }
        }
      );
    });
  }

  initJVM() {
    const options = this.getOptions();
    const responsiveness = this.javapoly.isJavaPolyWorker ? 100 : 10;
    this.bfsReady.then(() => {
      Promise.all(this.mountHub).then(() => {
        this.javapoly.jvm = new Doppio.VM.JVM({
          doppioHomePath: options.doppioLibUrl,
          bootstrapClasspath: ['/sys/vendor/java_home/lib/rt.jar', "/javapoly/classes"],
          classpath: this.classpath,
          javaHomePath: '/sys/vendor/java_home',
          extractionPath: '/tmp',
          nativeClasspath: ['/sys/natives', "/javapoly/natives"],
          assertionsEnabled: options.assertionsEnabled,
          responsiveness: responsiveness
        }, (err, jvm) => {
          if (err) {
            console.log('err loading JVM ' + this.javapoly.getId() + ' :', err);
          } else {
            jvm.runClass('com.javapoly.Main', [this.javapoly.getId()], function(exitCode) {
              // Control flow shouldn't reach here under normal circumstances,
              // because Main thread keeps polling for messages.
              console.log("JVM Exit code: ", exitCode);
            });
          }
        });
      });
    });
  }

  installStreamHandlers() {
    this.process.stdout.on('data', (data) => {
      const ds = data.toString();
      if (ds != "\n") {
        console.log("JVM " + this.javapoly.getId() + " stdout>", ds);
      }
    });
    this.process.stderr.on('data', (data) => {
      const ds = data.toString();
      if (ds != "\n") {
        console.warn("JVM " + this.javapoly.getId() + " stderr>", ds);
      }
    });
  }

}

export default DoppioManager;
