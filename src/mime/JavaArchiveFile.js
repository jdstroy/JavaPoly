import JavaFile from './JavaFile';

class JavaArchiveFile extends JavaFile  {
  constructor(javaPolyLoader, script) {
  	let Buffer = global.BrowserFS.BFSRequire('buffer').Buffer;
  	let path   = global.BrowserFS.BFSRequire('path');

    super(javaPolyLoader, script);
    let scriptSrc = script.src;

    this.javaPolyLoader.loadingHub.push(
      JavaFile.http_retrieve_buffer(scriptSrc).then(data => {
       let jarFileData = new Buffer(data);
       let jarName = path.basename(scriptSrc);

       return new Promise((resolve, reject) => {
      	 let jarStorePath = path.join(this.javaPolyLoader.options.storageDir, jarName);
      	 // store the .jar file to $storageDir
      	 this.javaPolyLoader.fs.writeFile(jarStorePath, jarFileData, (err) => {
      		 if (err) {
      			 console.error(err.message);
      			 reject();
      			 } else {
      				 // add .jar file path to classpath
      				 this.javaPolyLoader.classpath.push(jarStorePath);
      				 resolve();
      			 }
      		 });
      	 });
       })
     );
  }
}

export default JavaArchiveFile;
