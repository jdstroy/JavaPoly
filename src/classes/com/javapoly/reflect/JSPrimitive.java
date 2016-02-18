package com.javapoly.reflect;

import com.javapoly.Eval;

public class JSPrimitive extends JSValue {
  public JSPrimitive(final Object rawValue) {
    super(rawValue);
  }

  public boolean isNull() {
    return rawValue == null;
  }

  public double asDouble() {
    return asDouble(rawValue);
  }

  public int asInteger() {
    return asInteger(rawValue);
  }

  public long asLong() {
    return asLong(rawValue);
  }

  public String asString() {
    return asString(rawValue);
  }

  private static native double asDouble(Object obj);
  private static native String asString(Object obj);
  private static native int asInteger(Object obj);
  private static native long asLong(Object obj);
}

