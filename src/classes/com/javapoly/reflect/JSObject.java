package com.javapoly.reflect;

import com.javapoly.Eval;

public interface JSObject extends JSValue {
  public JSValue getProperty(String name);

  public JSValue invoke(Object... args);
}

