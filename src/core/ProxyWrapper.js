import JavaClassWrapper from './JavaClassWrapper';

class ProxyWrapper {

  static createEntity(javapoly, name, parent) {
    // We don't now in advance is it a function or just an Object
    // But objects cannot be called, so it is a function
    const object = function() {};
    object._parent = parent;
    object._name = name;
    if (parent !== null) {
      object._identifier = (parent._identifier === null ? '' : parent._identifier + '.') + name;
    } else {
      object._identifier = name;
    }
    object._call = function(thisArg, argumentsList) {
      return new Promise(
        (resolve, reject) => {
          JavaClassWrapper.runProxyMethod(javapoly, object, argumentsList).then(rv => resolve(rv));
        }
      );
    };

    const proxy = new Proxy(object, {
      get: (target, property) => {
        if (!target.hasOwnProperty(property)) {
          target[property] = this.createEntity(javapoly, property, target);
        }
        return target[property];
      },
      apply: (target, thisArg, argumentsList) => {
        return target._call(thisArg, argumentsList);
      }
    });

    return proxy;
  }

  static createRootEntity(javapoly, name) {
    return this.createEntity(javapoly, name, null);
  }
}

export default ProxyWrapper;
