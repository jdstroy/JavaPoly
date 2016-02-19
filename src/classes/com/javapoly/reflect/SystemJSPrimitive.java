package com.javapoly.reflect;

import com.javapoly.Eval;

public class SystemJSPrimitive extends SystemJSValue implements JSPrimitive {
  public SystemJSPrimitive(final Object rawValue) {
    super(rawValue);
  }

  public boolean isNull() {
    return rawValue == null;
  }

  public double asDouble() {
    return (Double) rawValue;
  }

  public int asInteger() {
    return (Integer) rawValue;
  }

  public long asLong() {
    return (Long)rawValue;
  }

  public String asString() {
    // return (String)rawValue;
    return "TODO";
  }

  public Object getRawValue() {
    // TODO: Check for null
    return rawValue;
  }
}

