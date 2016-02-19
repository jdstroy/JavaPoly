import JavaClassWrapper from "./JavaClassWrapper";
import WrapperUtil from "./WrapperUtil";

class Wrapper {
  constructor(dispatcher) {
    this.dispatcher = dispatcher;
  }

  init(obj, methods, nonFinalFields, finalFields) {
    const wrapper = this;

    // Add method handlers
    for (const name of methods) {
      obj[name] = function() {
        return wrapper.runMethodWithJSReflection(name, Array.prototype.slice.call(arguments))
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

  runMethodWithJSReflection(methodName, args) {
    const wrapper = this;
    const okToReflect = !wrapper.isReflectMethod(methodName);

    const reflectedArgs = args.map((e) => wrapper.dispatcher.reflect(e));

    const resultPromise = wrapper.runMethodWithJavaDispatching(methodName, reflectedArgs);

    if (okToReflect) {
      return resultPromise.then((result) => wrapper.dispatcher.unreflect(result));
    } else {
      return resultPromise;
    }
  }
}

export default Wrapper;
