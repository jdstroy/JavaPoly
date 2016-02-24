package com.javapoly.reflect;

import com.javapoly.Main;
import com.javapoly.SystemBridge;

public class SystemJSObject extends SystemJSValue implements JSObject {
  private final SystemBridge bridge;

  public SystemJSObject(final Object rawValue, final SystemBridge bridge) {
    super(rawValue);
    this.bridge = bridge;
  }

  public JSValue getProperty(String name) {
    final JSValue result = bridge.getObjectProperty(name, (Integer) rawValue);
    return result;
  }

  public JSValue invoke(Object... args) {
    final Object[] unwrappedArgs = new Object[args.length];
    for (int i = 0; i < args.length; i++) {
      final Object e = args[i];
      unwrappedArgs[i] = (e instanceof SystemJSValue) ? ((SystemJSValue) e).rawValue : e;
    }
    return invoke(rawValue, unwrappedArgs);
  }

  private JSValue invoke(Object functionObj, Object... args) {
    return bridge.invoke(functionObj, args);
  }

  public int getRawValue() {
    return (Integer) rawValue;
  }
}


