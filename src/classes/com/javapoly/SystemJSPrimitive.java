package com.javapoly;

import com.javapoly.Eval;
import com.javapoly.reflect.*;

final class SystemJSPrimitive extends SystemJSValue implements JSPrimitive {
  public SystemJSPrimitive(final Object rawValue) {
    super(rawValue);
  }

  public boolean isNull() {
    return rawValue == null;
  }

  public double asDouble() {
    return ((Number) rawValue).doubleValue();
  }

  public int asInteger() {
    return ((Number) rawValue).intValue();
  }

  public long asLong() {
    return ((Number) rawValue).longValue();
  }

  public String asString() {
    return (String)rawValue;
  }

  public Object getRawValue() {
    // TODO: Check for null
    return rawValue;
  }
}

