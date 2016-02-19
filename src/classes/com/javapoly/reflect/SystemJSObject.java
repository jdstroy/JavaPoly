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
    return Main.wrapValue(invoke(rawValue, unwrappedArgs));
  }

  private static Object[] invoke(Object functionObj, Object... args) {
    // TODO
    System.out.println("TODO: Invoke");
    return null;
  }

  public int getRawValue() {
    return (Integer) rawValue;
  }
}


