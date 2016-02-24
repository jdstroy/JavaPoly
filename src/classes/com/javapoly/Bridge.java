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

  JSValue eval(String s);
  JSValue wrapValue(String descripton, Object obj);
  JSValue reflectJSValue(final Object[] obj);
  Object[] reflectParams(final Object[] params);
}

