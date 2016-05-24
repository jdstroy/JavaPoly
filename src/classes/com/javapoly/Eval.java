package com.javapoly;

import com.javapoly.reflect.*;

public final class Eval {

  /** Evals the provided string and returns a wrapped result that can be introspected in Java */
  public static final JSValue eval(String s) {
    final SecurityManager security = System.getSecurityManager();
    if (security != null) {
        security.checkPermission(new RuntimePermission("javascriptEval"));
    }
    return Main.bridgedEval(s);
  }
}
