package com.javapoly;

public class Eval {

  /** Evals the provided string and returns a wrapped result that can be introspected in Java */
  public static JSValue eval(String s) {
    return wrapValue(evalRaw(s));
  }

  /** Evals the provided string and returns a wrapped result that can be introspected in Java */
  public static JSValue reflectJSValue(final Object obj) {
    final Object[] data = getRawType(obj);
    return wrapValue(data);
  }

  /** Evals the provided string and returns the raw javascript result.
   *
   *  Mostly used internally. In general, use the above `eval` method which is more convenient.
   *
   *  In the returned array, the first element is of type `String`, containging the result of JS `typeof`.
   *  and the second element is the actual result of eval.
   * */
  public static native Object[] evalRaw(String s);

  private static JSValue wrapValue(Object[] res) {
    final String description = (String) res[0];
    switch (description) {
      case "object":
      case "function":
        return new JSObject(res[1]);
      case "undefined":
      case "boolean":
      case "number":
      case "string":
        return new JSPrimitive(res[1]);
      default:
        // TODO
        return null;
    }
  }

  public abstract static class JSValue {
    final Object rawValue;
    JSValue(final Object rawValue) {
      this.rawValue = rawValue;
    }

    /* Although this works, doppio dev build has an assertion that prevents a java function from returning pure JS objects */
    /*
    public Object getRawValue() {
      return rawValue;
    }
    */
  };

  public static class JSPrimitive extends JSValue {
    public JSPrimitive(final Object rawValue) {
      super(rawValue);
    }

    public boolean isNull() {
      return rawValue == null;
    }

    public double asDouble() {
      return Eval.asDouble(rawValue);
    }

    public int asInteger() {
      return Eval.asInteger(rawValue);
    }

    public long asLong() {
      return Eval.asLong(rawValue);
    }

    public String asString() {
      return Eval.asString(rawValue);
    }
  }

  public static class JSObject extends JSValue {
    public JSObject(final Object rawValue) {
      super(rawValue);
    }

    public JSValue getProperty(String name) {
      return wrapValue(Eval.getProperty(rawValue, name));
    }

    public JSValue invoke(Object... args) {
      final Object[] unwrappedArgs = new Object[args.length];
      for (int i = 0; i < args.length; i++) {
        final Object e = args[i];
        unwrappedArgs[i] = (e instanceof JSValue) ? ((JSValue) e).rawValue : e;
      }
      return wrapValue(Eval.invoke(rawValue, unwrappedArgs));
    }
  }

  private static native Object[] invoke(Object functionObj, Object... args);
  private static native double asDouble(Object obj);
  private static native String asString(Object obj);
  private static native int asInteger(Object obj);
  private static native long asLong(Object obj);
  private static native Object[] getRawType(Object obj);

  private static native Object[] getProperty(Object obj, String name);
}
