import CommonDispatcher from './CommonDispatcher.js'
import DoppioManager from '../doppioManager/DoppioManager.js'

/* Used for the case when javaploy is running in Browser */
class BrowserDispatcher extends CommonDispatcher {

  constructor(options) {
    super(options);
  }

  initDoppioManager(options) {
    return this.loadExternalJs(options.browserfsLibUrl + 'browserfs.min.js').then(()=> {
      return this.loadExternalJs(options.doppioLibUrl + 'doppio.js').then(() => {
        return new DoppioManager(window.javapoly);
      });
    });
  }

  postMessage(messageType, priority, data, callback) {
    const id = this.javaPolyIdCount++;

    this.handleIncomingMessage(id, priority, messageType, data, callback);
  }

  /**
   * load js library file.
   * @param fileSrc
   * 		the uri src of the file
   * @return Promise
   * 		we could use Promise to wait for js loaded finished.
   */
  loadExternalJs(fileSrc){
  	return new Promise((resolve, reject) => {
    	const jsElm = global.document.createElement("script");
    	jsElm.type = "text/javascript";

    	if(jsElm.readyState){
    		jsElm.onreadystatechange = function(){
    			if (jsElm.readyState=="loaded" || jsElm.readyState=="complete"){
    				jsElm.onreadysteatechange=null;
    				resolve();
    			}
    		}
    	}else{
    		jsElm.onload=function(){
    			resolve();
    			// FIXME reject when timeout
    		}
    	}

    	jsElm.src = fileSrc;
    	global.document.getElementsByTagName("head")[0].appendChild(jsElm);
  	});
  };

}

export default BrowserDispatcher;
