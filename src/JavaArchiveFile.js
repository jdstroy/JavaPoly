import JavaFile from './JavaFile';

//const Buffer = global.BrowserFS.BFSRequire('buffer').Buffer;
//const path   = global.BrowserFS.BFSRequire('path');

// TODO need to reuse the code in JavaClassFile rather than copy
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

class JavaArchiveFile extends JavaFile  {
  constructor(javaPoly, script) {
  	let Buffer = global.BrowserFS.BFSRequire('buffer').Buffer;
  	let path   = global.BrowserFS.BFSRequire('path');

    super(javaPoly, script);
    let scriptSrc = script.src;

    this.javaPoly.loadingHub.push(
      http_retrieve_buffer(scriptSrc).then(data => {
       let jarFileData = new Buffer(data);
       let jarName = path.basename(scriptSrc);

       return new Promise((resolve, reject) => {
      	 let jarStorePath = path.join(this.javaPoly.options.storageDir, jarName);
      	 // store the .jar file to $storageDir
      	 this.javaPoly.fs.writeFile(jarStorePath, jarFileData, (err) => {
      		 if (err) {
      			 console.error(err.message);
      			 reject();
      			 } else {
      				 // add .jar file path to classpath
      				 this.javaPoly.classpath.push(jarStorePath);
      				 resolve();
      			 }
      		 });
      	 });
       })
     );
  }
}

export default JavaArchiveFile;
