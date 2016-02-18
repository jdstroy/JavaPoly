package com.javapoly;

import com.javapoly.reflect.*;

public class Eval {

  /** Evals the provided string and returns a wrapped result that can be introspected in Java */
  public static JSValue eval(String s) {
    return wrapValue(evalRaw(s));
  }

  /** Evals the provided string and returns the raw javascript result.
   *
   *  Mostly used internally. In general, use the above `eval` method which is more convenient.
   *
   *  In the returned array, the first element is of type `String`, containing the result of JS `typeof`.
   *  and the second element is the actual result of eval.
   * */
  public static native Object[] evalRaw(String s);

  public static JSValue wrapValue(Object[] res) {
    final String description = (String) res[0];
    switch (description) {
      case "object":
      case "function":
        return new DoppioJSObject(res[1]);
      case "undefined":
      case "boolean":
      case "number":
      case "string":
        return new DoppioJSPrimitive(res[1]);
      default:
        // TODO
        return null;
    }
  }

  /** Wraps the provided JS object so that it can be introspected in Java */
  static JSValue reflectJSValue(final Object obj) {
    final Object[] data = getRawType(obj);
    return wrapValue(data);
  }

  private static native Object[] getRawType(Object obj);
}
