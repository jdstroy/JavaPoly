package com.javapoly;

import com.javapoly.reflect.*;

interface Bridge {
  String getMessageId();
  Object[] getData(String messageId);
  String getMessageType(String messageId);
  void dispatchMessage(String messageId);
  void returnResult(String messageId, Object returnValue);
  void returnErrorFlat(String messageId, FlatThrowable ft);
  void setJavaPolyInstanceId(String javapolyId);

  JSValue wrapValue(Object[] res);
  JSValue reflectJSValue(final Object[] obj);
}

