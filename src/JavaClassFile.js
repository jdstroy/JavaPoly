import JavaFile from './JavaFile';

const Buffer = global.BrowserFS.BFSRequire('buffer').Buffer;
const path   = global.BrowserFS.BFSRequire('path');

const classfile = require('./tools/classfile.js');

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
  constructor(javaPoly, script) {
    super(javaPoly, script);

    let scriptSrc = script.src;

    this.javaPoly.loadingHub.push(
      http_retrieve_buffer(scriptSrc).then(data => {
        let classFileData = new Buffer(data);
        let classFileInfo = classfile.analyze(classFileData);
        let className   = path.basename(classFileInfo.this_class);
        let packageName = path.dirname(classFileInfo.this_class);

        this.javaPoly.fsext.rmkdirSync(path.join(this.javaPoly.options.storageDir, packageName));

        return new Promise((resolve, reject) => {
          this.javaPoly.fs.writeFile(path.join(this.javaPoly.options.storageDir, classFileInfo.this_class + '.class'),
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