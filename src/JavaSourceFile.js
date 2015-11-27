import JavaFile from './JavaFile';

//const path = global.BrowserFS.BFSRequire('path');

class JavaSourceFile extends JavaFile  {
  constructor(javaPoly, script) {
    super(javaPoly, script);

    /**
     * Source code of Java file
     * @type {String}
     */
    this.source = script.text;

    this.classname = 'TestCompile';

    let path = global.BrowserFS.BFSRequire('path');

    this.filename = path.join(javaPoly.options.storageDir, this.classname + '.java');

    this.javaPoly.fs.writeFile(this.filename, this.source, err => {
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
      global.window.Java.type('javax.tools.ToolProvider').then( ToolProvider => {
        ToolProvider.getSystemJavaCompiler().then(JavaCompiler => {
          // console.log(this.javaPoly.jvm);
          // console.log(JavaCompiler);
          // JavaCompiler.run(null, null, null, this.filename).then(result => {
            // if (result === 0) {
              resolve();
            // } else {
              // reject();
            // }
          // });          
        });
      });
    });
  }
}

export default JavaSourceFile;