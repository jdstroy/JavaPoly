package com.javapoly;

import com.javapoly.reflect.*;

public class Eval {

  /** Evals the provided string and returns a wrapped result that can be introspected in Java */
  public static JSValue eval(String s) {
    return Main.wrapValue(evalRaw(s));
  }

  /** Evals the provided string and returns the raw javascript result.
   *
   *  Mostly used internally. In general, use the above `eval` method which is more convenient.
   *
   *  In the returned array, the first element is of type `String`, containing the result of JS `typeof`.
   *  and the second element is the actual result of eval.
   * */
  public static native Object[] evalRaw(String s);

}
