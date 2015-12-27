class JavaFile {
  constructor(javaPolyLoader, script) {
    this.javaPolyLoader = javaPolyLoader;
    this.script = script;
  }

  static http_retrieve_buffer (url) {
    return new Promise((resolve, reject) => {
      const xmlr = new XMLHttpRequest();
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
}

export default JavaFile ;
