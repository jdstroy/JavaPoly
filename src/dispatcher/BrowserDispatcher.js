"use strict";
import CommonDispatcher from './CommonDispatcher.js'
import DoppioManager from '../jvmManager/DoppioManager.js'
import WrapperUtil from "../core/WrapperUtil";

/* Used for the case when javaploy is running in Browser */
class BrowserDispatcher extends CommonDispatcher {

  constructor(javapoly) {
    super(javapoly);
    this.javapoly = javapoly;
  }

  initDoppioManager(javapoly) {
    return this.loadExternalJs(javapoly.options.browserfsLibUrl + 'browserfs.min.js').then(()=> {
      return this.loadExternalJs(javapoly.options.doppioLibUrl + 'doppio.js').then(() => {
        return new DoppioManager(javapoly);
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

  reflect(jsObj) {
    return jsObj;
  }

  unreflect(result) {
    if ((!!result) && (typeof(result) === "object") && (!!result._javaObj)) {
      const className = result._javaObj.getClass().className;
      if (className === "Lcom/javapoly/reflect/DoppioJSObject;" || className === "Lcom/javapoly/reflect/DoppioJSPrimitive;") {
        return result._javaObj["com/javapoly/reflect/DoppioJSValue/rawValue"];
      }
    }
    return result;
  }

}

export default BrowserDispatcher;
