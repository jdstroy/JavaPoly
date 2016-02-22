package com.javapoly;

import com.javapoly.reflect.*;

public class Eval {

  /** Evals the provided string and returns a wrapped result that can be introspected in Java */
  public static JSValue eval(String s) {
    return Main.bridgedEval(s);
  }

}
