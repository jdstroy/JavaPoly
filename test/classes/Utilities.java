package com.javapoly.runtime;

import java.lang.reflect.*;

public class Utilities {

  public static Object invokeClassMethod(String className, String methodName, Object[] params) {
    Class<?> clazz;
    try {
      clazz = Class.forName(className);
    } catch (ClassNotFoundException e) {
      // TODO Return some error
      return null;
    }
    Method[] methods = clazz.getMethods();
    try {
      Method suitableMethod = matchMethod(methods, methodName);
      Object returnValue = suitableMethod.invoke(null, params);
      return returnValue;
    } catch (InvocationTargetException | IllegalAccessException e) {
      // TODO Return some error
      return null;
    }
  }

  private static Method matchMethod(Method[] methods, String methodName) {
    for (Method method : methods) {
      if (methodName.equals(method.getName())) {
        return method;
      }
    }
    return null;
  }

  /* Evaluates a Javascript expression and returns the result as a POJO */
  public static native Object eval(String expr);
}
