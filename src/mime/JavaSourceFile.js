import JavaFile from './JavaFile';
import ProxyWrapper from '../core/ProxyWrapper';
import JavaParser from 'jsjavaparser';
import WrapperUtil from '../core/WrapperUtil';

//const path = global.BrowserFS.BFSRequire('path');

class JavaSourceFile extends JavaFile  {
  constructor(javapoly, script) {
    super(javapoly, script);

    this.javapoly = javapoly;

    /**
     * Source code of Java file
     * @type {String}
     */
    this.source = script.text;

    let classInfo = JavaSourceFile.detectClassAndPackageNames(this.source);

    this.classname = classInfo.class;
    this.packagename = classInfo.package;

    const isProxySupported = (typeof Proxy !== 'undefined');
    if (isProxySupported) {
      this.createProxyForClass(this.classname, this.packagename);
    }

    let path = global.BrowserFS.BFSRequire('path');

    this.filename = path.join(
      javapoly.options.storageDir,
      this.packagename ? this.packagename.replace(/\./g, '/') : '.',
      this.classname + '.java'
    );

    this.javapoly.fsext.rmkdirSync(path.dirname(this.filename));

    this.javapoly.fs.writeFile(this.filename, this.source, err => {
      if (err) {
        console.error(err);
      }
    });
  }

  createProxyForClass(classname, packagename) {
    if (packagename != null) {
      let name = packagename.split('.')[0];
      global.window[name] = ProxyWrapper.createRootEntity(name);
    } else {
      global.window[classname] = ProxyWrapper.createRootEntity(classname);
    }
  }

  /**
   * This functions parse Java source file and detects its name and package
   * @param  {String} source Java source
   * @return {Object}        Object with fields: package and class
   */
  static detectClassAndPackageNames(source) {
    let className = null, packageName = null;

    let parsedSource = JavaParser.parse(source);

    if (parsedSource.node === 'CompilationUnit') {
      for (var i = 0; i < parsedSource.types.length; i++) {
        if (JavaSourceFile.isPublic(parsedSource.types[i])) {
          className = parsedSource.types[i].name.identifier;
          break;
        }
      }
      if (parsedSource.package) {
        packageName = JavaSourceFile.getPackageName(parsedSource.package.name);
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
      return JavaSourceFile.getPackageName(node.qualifier) + '.' + node.name.identifier;
    } else {
      return node.identifier;
    }
  }

  /**
   * Compile file from source property. It depends on global Java object.
   * @return {Promise} to detect when it finishes
   */
  compile() {
    return new Promise((resolve, reject) => {
      WrapperUtil.dispatchOnJVM(
        "FILE_COMPILE",
        ['-d', this.javapoly.options.storageDir, this.filename],
        resolve
      )
    });
  }
}

export default JavaSourceFile;
