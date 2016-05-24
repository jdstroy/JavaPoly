package com.javapoly;

import com.javapoly.reflect.*;

abstract class SystemJSValue implements JSValue {
  final protected Object rawValue;

  public SystemJSValue(final Object rawValue) {
    this.rawValue = rawValue;
  }

};

