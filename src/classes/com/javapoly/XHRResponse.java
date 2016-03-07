package com.javapoly;

class XHRResponse {
  final Object xhrNativeObj;

  XHRResponse(final Object xhrNativeObj) {
    this.xhrNativeObj = xhrNativeObj;
  }

  byte[] getResponseBytes() {
    return getResponseBytes(xhrNativeObj);
  }

  String getHeaderField(String name) {
    return getHeaderField(xhrNativeObj, name);
  }

  private static native byte[] getResponseBytes(Object xhrNativeObj);

  private static native String getHeaderField(Object xhrNativeObj, String name);
}
