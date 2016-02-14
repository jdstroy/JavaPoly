package com.javapoly;

class DoppioBridge implements Bridge {
  public native String getMessageId();
  public native Object[] getData(String messageId);
  public native String getMessageType(String messageId);
  public native void dispatchMessage(String messageId);
  public native void returnResult(String messageId, Object returnValue);
  public native void returnErrorFlat(String messageId, FlatThrowable ft);
  public native void setJavaPolyInstanceId(String javapolyId);

  public void flushAllResponses() {
    // NOP
  }
}
