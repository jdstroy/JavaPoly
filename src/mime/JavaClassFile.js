import JavaFile from './JavaFile';

//const Buffer = global.BrowserFS.BFSRequire('buffer').Buffer;
//const path   = global.BrowserFS.BFSRequire('path');

const classfile = require('./../tools/classfile.js');

const http_retrieve_buffer = function(url) {
  return new Promise((resolve, reject) => {
    let xmlr = new XMLHttpRequest();
    xmlr.open('GET', url, true);
    xmlr.responseType = 'arraybuffer';
    xmlr.onreadystatechange = ()=> {
      if (xmlr.readyState === 4) {
        if (xmlr.status === 200) {
          resolve(xmlr.response);
        } else {
          reject();
        }
      }
    }
    xmlr.send(null);
  });
}

/**
 * Class for loading java class files from script. This class loads files from scripts like this:
 * <script type="application/java-vm" src="Main.class"></script>
 */
class JavaClassFile extends JavaFile {
  constructor(javaPolyLoader, script) {
  	let Buffer = global.BrowserFS.BFSRequire('buffer').Buffer;
  	let path   = global.BrowserFS.BFSRequire('path');

    super(javaPolyLoader, script);

    let scriptSrc = script.src;

    this.javaPolyLoader.loadingHub.push(
      http_retrieve_buffer(scriptSrc).then(data => {
        let classFileData = new Buffer(data);
        let classFileInfo = classfile.analyze(classFileData);
        let className   = path.basename(classFileInfo.this_class);
        let packageName = path.dirname(classFileInfo.this_class);

        this.javaPolyLoader.fsext.rmkdirSync(path.join(this.javaPolyLoader.options.storageDir, packageName));

        return new Promise((resolve, reject) => {
          this.javaPolyLoader.fs.writeFile(path.join(this.javaPolyLoader.options.storageDir, classFileInfo.this_class + '.class'),
            classFileData, (err) => {
              if (err) {
                console.error(err.message);
                reject();
              } else {
                resolve();
              }
            }
          );
        });
      })
    );
  }
}

export default JavaClassFile;