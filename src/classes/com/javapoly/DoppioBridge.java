package com.javapoly;

import com.javapoly.reflect.*;

class DoppioBridge implements Bridge {
  public native String getMessageId();
  public native Object[] getData(String messageId);
  public native String getMessageType(String messageId);
  public native void dispatchMessage(String messageId);
  public native void returnResult(String messageId, Object returnValue);
  public native void returnErrorFlat(String messageId, FlatThrowable ft);
  public native void setJavaPolyInstanceId(String javapolyId);

  private static native Object[] getRawType(Object obj);

  public JSValue wrapValue(Object[] res) {
    final String description = (String) res[0];
    switch (description) {
      case "object":
      case "function":
        return new DoppioJSObject(res[1]);
      case "undefined":
      case "boolean":
      case "number":
      case "string":
        return new DoppioJSPrimitive(res[1]);
      default:
        // TODO
        return null;
    }
  }

  /** Wraps the provided JS object so that it can be introspected in Java */
  public JSValue reflectJSValue(final Object[] obj) {
    final Object[] data = getRawType(obj[0]);
    return wrapValue(data);
  }
}
