import JavaFile from './JavaFile';

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

    let classInfo = JavaSourceFile.detectClassAndPackageNames(this.source);

    this.classname = classInfo.class;
    this.packagename = classInfo.package;

    let path = global.BrowserFS.BFSRequire('path');

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
   * This functions parse Java source file and detects its name and package
   * @param  {String} source Java source
   * @return {Object}        Object with fields: package and class
   */
  static detectClassAndPackageNames(source) {
    // this regexp removes all comments in source
    source = source.replace(/(\/\*[^]*\*\/|\/\/[^\n]*\n)/gi, ' ');

    let className = source.match(/class\s+([^\s\{]+)(\s|\{)/);
    let packageName = source.match(/package\s+([^\s;]+)\s*;/)

    return {
      package: packageName ? packageName[1] : null,
      class:   className   ? className[1]   : null
    }
  }

  /**
   * Compile file from source property. It depends on global Java object.
   * @return {Promise} to detect when it finishes
   */
  compile() {
    return new Promise((resolve, reject) => {
      this.javapoly.javapoly.dispatcher.postMessage(
        "FILE_COMPILE", 
        ['-d', this.javapoly.options.storageDir, this.filename], 
        (res) => {
          resolve();
        }
      );
    });
  }
}

export default JavaSourceFile;