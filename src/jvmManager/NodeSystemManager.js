import CommonUtils from '../core/CommonUtils.js';
import WrapperUtil from '../core/WrapperUtil.js';

/**
 * The NodeDoppioManager manages the Doppio JVM on Node
 */
export default class NodeSystemManager {
  constructor(javapoly, wsPort, secret) {
    this.javapoly = javapoly;
    this.wsPort = wsPort;
    this.secret = secret;

    /**
     * Array that contains classpath, include the root path of class files , jar file path.
     * @type {Array}
     */
    const options = this.getOptions();
    this.classpath = [options.javapolyBase + "/classes", options.storageDir];

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
            resolve();
          }
        }
      );
    });
  }

  initJVM() {
    const childProcess = require('child_process');
    const spawn = childProcess.spawn;
    const classPath = 'build/jars/java_websocket.jar:build/jars/javax.json-1.0.4.jar:build/classes:/tmp/data';
    const args = ['-cp', classPath, 'com.javapoly.Main', this.javapoly.getId(), "system", this.wsPort, this.secret];
    const child = spawn('java', args);
    child.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    child.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    child.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
    });
  }
}
