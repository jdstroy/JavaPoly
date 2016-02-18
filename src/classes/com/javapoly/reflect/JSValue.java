package com.javapoly.reflect;

public abstract class JSValue {
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

