import JavaParser from 'jsjavaparser';

const CLASS_MAGIC_NUMBER = 'cafebabe';
const ZIP_MAGIC_NUMBER = '504b0304';


class CommonUtils {
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
    let bufferGetter = (global.BrowserFS) ? (index) => { return buffer.get(index); } : (index) => {return buffer[index]; };
    for(let i = 0; i < count; i++) {
      var ss = bufferGetter(from + i).toString(16);
      if (ss.length < 2) ss = '0' + ss;
      str.push(ss);
    }
    return str.join('');
  }

  /**
   * Detects if passed 'data' is zip file
   * @param {String|Buffer} data URL string or data buffer
   * @return {Boolean}
   */
  static isZipFile(data){
    if (typeof data === 'string') {
      return data.endsWith('.jar') || data.endsWith('.zip');
    } else {
      return ZIP_MAGIC_NUMBER === CommonUtils.hexFromBuffer(data, 0, 4);
    }
  }
  
/**
   * Detects if passed 'data' is class file
   * @param {String|Buffer} data URL string or data buffer
   * @return {Boolean}
   */
  static isClassFile(data){
    if (typeof data === 'string') {
      return data.endsWith('.class');
    } else {
      return CLASS_MAGIC_NUMBER === CommonUtils.hexFromBuffer(data, 0, 4);
    }
  }

  /**
   * This functions parse Java source file and detects its name and package
   * @param  {String} source Java source
   * @return {Object}        Object with fields: package and class
   */
  static detectClassAndPackageNames(source) {
    let className = null, packageName = null;

    let parsedSource;
    try {
      parsedSource = JavaParser.parse(source);
    } catch (e) {
      return null;
    }

    if (parsedSource.node === 'CompilationUnit') {
      for (var i = 0; i < parsedSource.types.length; i++) {
        if (CommonUtils.isPublic(parsedSource.types[i])) {
          className = parsedSource.types[i].name.identifier;
          break;
        }
      }
      if (parsedSource.package) {
        packageName = CommonUtils.getPackageName(parsedSource.package.name);
      }
    }

    return {
      package: packageName,
      class:   className
    }
  }

  static isPublic(node) {
    if (node.modifiers) {
      for (var i = 0; i < node.modifiers.length; i++) {
        if (node.modifiers[i].keyword === 'public') {
          return true;
        }
      }
    }
    return false;
  }

  static getPackageName(node) {
    if (node.node === 'QualifiedName') {
      return CommonUtils.getPackageName(node.qualifier) + '.' + node.name.identifier;
    } else {
      return node.identifier;
    }
  }

  // Utility function to create a deferred promise
  static deferred() {
    this.promise = new Promise(function(resolve, reject) {
      this.resolve = resolve;
      this.reject = reject;
    }.bind(this));
    Object.freeze(this);
    return this;
  }

}

export default CommonUtils;
