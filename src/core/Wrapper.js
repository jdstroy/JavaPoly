import JavaClassWrapper from "./JavaClassWrapper";

class Wrapper {
  constructor() {
    // NOP
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

  reflect(jsObj) {
    return JavaClassWrapper.getClassWrapperByName(this.javapoly, "com.javapoly.Eval").then((Eval) => {
      return Eval.reflectJSValue(jsObj);
    });
  }

  runMethodWithJSReflection(methodName, args) {
    const wrapper = this;
    const okToReflect = !wrapper.isReflectMethod(methodName);

    const wrappedArgPromises = args.map (e => {
      if (okToReflect && (typeof(e) === "object") && (!e._javaObj)) {
        return wrapper.reflect(e);
      } else {
        return Promise.resolve(e);
      }
    });

    function checkValue(value) {
      function pad(str) {
        return ('0000000000000000' + str).slice(-16);
      }
      // Check if what we're getting is doppio's representation of a long (gLong)
      // This is a little bit hacky, but AFAIK, checking for properties is the only way to test.
      if (value.hasOwnProperty('high_') && value.hasOwnProperty('low_')) {
        // If it is a gLong, see if it's small enough to fit into a JavaScript Number.
        // This is tricky because we can't use number comparisons (since it will round)
        if (value.isNegative()) {
          if (pad(value.negate().toString()).localeCompare('9007199254740991') =< 0) {
            return value.toNumber();
          } else {
            throw new RangeError('Unfortunately, JavaScript doesn\'t yet support 64 bit integers.');
          }  
        } else {
          // If it's less than the max value, we'll convert it to a JS Number
          if (pad(value.toString()).localeCompare('9007199254740991') =< 0) {
            return value.toNumber();
          } else {
            // Otherwise, we'll throw an error
            throw new RangeError('Unfortunately, JavaScript doesn\'t yet support 64 bit integers.');
          }
        }
      } else {
        return value;
      }
    }

    return Promise.all(wrappedArgPromises).then((wrappedArgs) => {
      const resultPromise = wrapper.runMethodWithJavaDispatching(methodName, wrappedArgs);
      if (okToReflect) {
        return resultPromise.then(result => {
          if ((!!result) && (typeof(result) === "object") && (!!result._javaObj)) {
            const className = result._javaObj.getClass().className;
            if (className === "Lcom/javapoly/Eval$JSObject;" || className === "Lcom/javapoly/Eval$JSPrimitive;") {
              return result._javaObj["com/javapoly/Eval$JSValue/rawValue"];
            }
          }
          return checkValue(result);
        });
      } else {
        return resultPromise;
      }
    });
  }
}

export default Wrapper;
