const CLASS_MAGIC_NUMBER = 'cafebabe';
const ZIP_MAGIC_NUMBER = '504b0304';

class CommonUtils{
  static xhrRetrieve (url, responseType) {
    return new Promise((resolve, reject) => {
      const xmlr = new XMLHttpRequest();
      xmlr.open('GET', url, true);
      xmlr.responseType = responseType;
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

  static hexFromBuffer(buffer, from, count) {
    var str = [];
    for(let i = 0; i < count; i++) {
      var ss = buffer[from + i].toString(16);
      if (ss.length < 2) ss = '0' + ss;
      str.push(ss);
    }
    return str.join('');
  }

  static isZipFile(data){
    return ZIP_MAGIC_NUMBER === CommonUtils.hexFromBuffer(data, 0, 4);
  }

  static isClassFile(data){
    return CLASS_MAGIC_NUMBER === CommonUtils.hexFromBuffer(data, 0, 4);
  }
}

export default CommonUtils;