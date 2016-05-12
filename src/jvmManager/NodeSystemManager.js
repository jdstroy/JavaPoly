import CommonUtils from '../core/CommonUtils.js';
import WrapperUtil from '../core/WrapperUtil.js';

import http from 'http';

/**
 * The NodeDoppioManager manages the Doppio JVM on Node
 */
export default class NodeSystemManager {
  constructor(javapoly, secret, httpPortDeffered, jsServer) {
    this.javapoly = javapoly;
    this.httpPortDeffered = httpPortDeffered;
    this.secret = secret;
    this.jsServer = jsServer;

    /**
     * Array that contains classpath, include the root path of class files , jar file path.
     * @type {Array}
     */
    const options = this.getOptions();
    this.classpath = [options.javapolyBase + "/classes", options.storageDir];
    this.javaBin = this.getJavaExec();
  }

  getOptions() {
    return this.javapoly.options;
  }

  dynamicMountJava(src) {
    const fs = require("fs");
    const options = this.getOptions();
    return new Promise((resolve, reject) => {
      // remote file, we need to download the file data of that url and parse the type.
      fs.readFile(src, (err, fileDataBuf) => {
        if (err) {
          reject(err);
        } else {
          // remote java class/jar file
          if (CommonUtils.isClassFile(fileDataBuf)){
            this.writeRemoteClassFileIntoFS(src, fileDataBuf).then(resolve, reject);
          } else if (CommonUtils.isZipFile(fileDataBuf)){
            WrapperUtil.dispatchOnJVM(this.javapoly, 'JAR_PATH_ADD', 10, ['file://'+src], resolve, reject);
          } else {

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
          }
        }
      });
    })
  }

  writeRemoteClassFileIntoFS(src, classFileData){
    const path = require('path');
    const fs = require("fs");
    const options = this.getOptions();
    const classfile = require('./../tools/classfile.js');
    const fsext = require('./../tools/fsext')(fs, path);

    return new Promise((resolve, reject) => {
      const classFileInfo = classfile.analyze(classFileData);
      const className   = path.basename(classFileInfo.this_class);
      const packageName = path.dirname(classFileInfo.this_class);

      fsext.rmkdirSync(path.join(options.storageDir, packageName));

      fs.writeFile(path.join(options.storageDir, classFileInfo.this_class + '.class'),
        classFileData, (err) => {
          if (err) {
            console.error(err.message);
            reject(err.message);
          } else {
            resolve("OK");
          }
        }
      );
    });
  }

  getJavaExec() {
    const path = require('path');
    const fs = require("fs");

    const homeRootDirectory = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
    const binDirName = '.jvm';
    const javaExec = (process.platform === 'win32') ? "java.exe" : "java";
    const javaFullPath = path.join(homeRootDirectory, binDirName, 'jre', 'bin', javaExec);

    try {
      const stat = fs.statSync(javaFullPath);
      if (stat.isFile()) {
        return javaFullPath;
      }
    } catch (e) {
      if (e.code === 'ENOENT') {
        // Java wasn't installed locally
      } else {
        // Hm unknown error
        console.error(e);
      }
    }
    return "java";
  }

  initJVM() {
    var javaBin = this.javaBin;
    this.jsServer.then((serverPort) => {
      const childProcess = require('child_process');
      const spawn = childProcess.spawn;

      const path = require('path');
      const currentDirectory = __dirname;
      const packageRoot = path.resolve(currentDirectory, "..");

      const classPath =  packageRoot + '/jars/java_websocket.jar:' + packageRoot + '/jars/javax.json-1.0.4.jar:' +
          packageRoot + '/classes:/tmp/data';

      const args = ['-cp', classPath, 'com.javapoly.Main', this.javapoly.getId(), "system", this.secret, serverPort];
      // const child = spawn('java', args, {detached: true, stdio: ['ignore', 'ignore', 'ignore']});
      const child = spawn(javaBin, args, {detached: true, stdio: 'inherit'});
      child.unref();
    });
  }
}
