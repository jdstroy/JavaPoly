package javapoly;

public class Eval {

  /** Evals the provided string and returns a wrapped result that can be introspected in Java */
  public static JSValue eval(String s) {
    return wrapResult(evalRaw(s));
  }

  /** Evals the provided string and returns the raw javascript result.
   *
   *  Mostly used internally. In general, use the above `eval` method which is more convenient.
   *
   *  In the returned array, the first element is of type `String`, containging the result of JS `typeof`.
   *  and the second element is the actual result of eval.
   * */
  public static native Object[] evalRaw(String s);

  private static JSValue wrapResult(Object[] res) {
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
    private final Object rawValue;
    JSValue(final Object rawValue) {
      this.rawValue = rawValue;
    }

    public Object getRawValue() {
      return rawValue;
    }
  };

  public static class JSPrimitive extends JSValue {
    public JSPrimitive(final Object rawValue) {
      super(rawValue);
    }

    public double asDouble() {
      return Eval.asDouble(getRawValue());
    }

    public int asInteger() {
      return Eval.asInteger(getRawValue());
    }

    public long asLong() {
      return Eval.asLong(getRawValue());
    }

    public String asString() {
      return Eval.asString(getRawValue());
    }
  }

  public static class JSObject extends JSValue {
    public JSObject(final Object rawValue) {
      super(rawValue);
    }

    public JSValue invoke(Object... args) {
      final Object[] unwrappedArgs = java.util.Arrays.stream(args).map(e -> (e instanceof JSValue) ? ((JSValue) e).getRawValue() : e).toArray();
      return wrapResult(Eval.invoke(getRawValue(), unwrappedArgs));
    }
  }

  private static native Object[] invoke(Object functionObj, Object... args);
  private static native double asDouble(Object obj);
  private static native String asString(Object obj);
  private static native int asInteger(Object obj);
  private static native long asLong(Object obj);
}
