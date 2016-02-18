package com.javapoly.dom;

import com.javapoly.Eval;
import com.javapoly.reflect.JSObject;

public class Window {

  public static void alert(String message) {
    ((JSObject)Eval.eval("window.alert")).invoke(message);
  }
}

