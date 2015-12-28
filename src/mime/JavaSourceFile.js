import JavaFile from './JavaFile';
import ProxyWrapper from '../core/ProxyWrapper';
import WrapperUtil from '../core/WrapperUtil';
import JavaPoly from '../core/JavaPoly';

//const path = global.BrowserFS.BFSRequire('path');

class JavaSourceFile extends JavaFile  {
  constructor(javapoly, script) {
    super(javapoly, script);

    this.javapoly = javapoly;

    /**
     * Source code of Java file
     * @type {String}
     */
    this.source = script.text;

    let classInfo = JavaPoly.detectClassAndPackageNames(script.text);

    this.classname = classInfo.class;
    this.packagename = classInfo.package;

    const path = global.BrowserFS.BFSRequire('path');

    this.filename = path.join(
      javapoly.options.storageDir,
      this.packagename ? this.packagename.replace(/\./g, '/') : '.',
      this.classname + '.java'
    );

    this.javapoly.fsext.rmkdirSync(path.dirname(this.filename));

    this.javapoly.fs.writeFile(this.filename, this.source, err => {
      if (err) {
        console.error(err);
      }
    });
  }

  /**
   * Compile file from source property. It depends on global Java object.
   * @return {Promise} to detect when it finishes
   */
  compile() {
    return new Promise((resolve, reject) => {
      WrapperUtil.dispatchOnJVM(
        "FILE_COMPILE",
        ['-d', this.javapoly.options.storageDir, this.filename],
        resolve
      )
    });
  }
}

export default JavaSourceFile;
