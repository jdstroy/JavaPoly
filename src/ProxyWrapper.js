import JavaClassWrapper from './JavaClassWrapper';

class ProxyWrapper {

  static createEntity(name, parent) {
    // We don't know in advance is it a function or just an Object
    // But objects cannot be called, so it is a function
    const object = function() {};
    object._parent = parent;
    object._name = name;
    if (parent !== null) {
      object._identifier = (parent._name === null ? '' : parent._identifier + '.') + name;
    }
    object._call = function(thisArg, argumentsList) {
      return new Promise(
        (resolve, reject) => {
          JavaClassWrapper.runProxyMethod(object, argumentsList).then(rv => resolve(rv));
        }
      );
    };

    const proxy = new Proxy(object, {
      get: (target, property) => {
        if (!target.hasOwnProperty(property)) {
          target[property] = this.createEntity(property, target);
        }
        return target[property];
      },
      apply: (target, thisArg, argumentsList) => {
        return target._call(thisArg, argumentsList);
      }
    });

    return proxy;
  }

  static createRootEntity() {
    return this.createEntity(null, null);
  }
}

export default ProxyWrapper;