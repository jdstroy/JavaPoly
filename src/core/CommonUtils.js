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
}

export default CommonUtils;