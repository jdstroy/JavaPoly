package com.javapoly.dom;

import com.javapoly.Eval;
import com.javapoly.reflect.JSObject;
import com.javapoly.reflect.JSPrimitive;

public class Math {

  public static double abs(double val) {
    final JSPrimitive result = (JSPrimitive)((JSObject)Eval.eval("Math.abs")).invoke(val);
    return result.asDouble();
  }

}
