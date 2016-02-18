package com.javapoly.reflect;

import com.javapoly.Eval;

public class JSObject extends JSValue {
  public JSObject(final Object rawValue) {
    super(rawValue);
  }

  public JSValue getProperty(String name) {
    return Eval.wrapValue(getProperty(rawValue, name));
  }

  public JSValue invoke(Object... args) {
    final Object[] unwrappedArgs = new Object[args.length];
    for (int i = 0; i < args.length; i++) {
      final Object e = args[i];
      unwrappedArgs[i] = (e instanceof JSValue) ? ((JSValue) e).rawValue : e;
    }
    return Eval.wrapValue(invoke(rawValue, unwrappedArgs));
  }

  private static native Object[] invoke(Object functionObj, Object... args);

  private static native Object[] getProperty(Object obj, String name);
}

