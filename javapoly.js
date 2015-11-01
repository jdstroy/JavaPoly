function createEntity(name, parent) {

  // We don't now in advance is it a function or just an Object
  // But objects cannot be called, so it is a function
  const object = function() {};
  object._parent = parent;
  object._identifier = (parent === null ? "" : parent._identifier + ".") + name,
  object._call = function(thisArg, argumentsList) {
    console.log("Function called: " + this._identifier + "(" + argumentsList + ")");
  }

  const proxy = new Proxy(object, {
    get: function(target, property) {
      if (! (property in target)) {
        target[property] = createEntity(property, target);
        console.log("New entity created: " + target[property]._identifier);
      }
      return target[property];
    },
    apply: function(target, thisArg, argumentsList) {
      target._call(thisArg, argumentsList);
    }
  });

  return proxy;
}

const java = createEntity("java", null);