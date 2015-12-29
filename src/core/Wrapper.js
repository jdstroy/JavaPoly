class Wrapper {
  constructor() {
    // NOP
  }

  init(obj, methods, nonFinalFields, finalFields) {
    const wrapper = this;

    // Add method handlers
    for (const name of methods) {
      obj[name] = function() {
        return wrapper.runMethodWithJavaDispatching(name, Array.prototype.slice.call(arguments))
      };
    }

    function methodExists(name) {
      return methods.findIndex(n => n == name) >= 0;
    }

    // Add getters and setters for non-final fields
    for (const name of nonFinalFields) {
      if (!methodExists(name)) {
        Object.defineProperty(obj, name, {
          get: () => wrapper.getFieldWithJavaDispatching(name),
          set: (newValue) => { wrapper.setFieldWithJavaDispatching(name, newValue) }
        });
      }
    }

    // Add getters for final fields
    for (const name of finalFields) {
      if (!methodExists(name)) {
        Object.defineProperty(obj, name, {
          get: () => wrapper.getFieldWithJavaDispatching(name)
        });
      }
    }
  }
}

export default Wrapper;
