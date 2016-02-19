package com.javapoly.reflect;

public abstract class SystemJSValue implements JSValue {
  final protected Object rawValue;

  public SystemJSValue(final Object rawValue) {
    this.rawValue = rawValue;
  }

};

