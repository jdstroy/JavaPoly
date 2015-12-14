package javapoly;

import java.lang.reflect.*;

public class Main {

  public static void main(final String[] args) {
    println("Java Main started");

    installListener();

    try {
      boolean done = false;
      while (!done) {
        final Object[] message = getMessage();
        final Object[] data = getData(message[0]);
        // If it is a method invokation
        if (data != null) {
          Object returnValue = null;
          try {
            returnValue = invokeClassMethod((String) data[0], (String) data[1], (Object[]) data[2]);
          } catch (Exception e) {
            println("Exception: " + e);
          } finally {
            returnResult(message[0], returnValue);
          }
        } else {
          // Run any other callback
          dispatchMessage(message[0]);
        }
      }
    } catch (Exception e) {
      println("Exception: " + e);
    }

    println("Java Main ended");
  }

  public static Object invokeClassMethod(String className, String methodName, Object[] params) throws Exception {
    Class<?> clazz = Class.forName(className);
    Method[] methods = clazz.getMethods();
    Method suitableMethod = matchMethod(methods, methodName, params);
    Object returnValue = suitableMethod.invoke(null, params);
    return returnValue;
  }

  private static Method matchMethod(Method[] methods, String methodName, Object[] params) {
    for (Method method : methods) {
      if (methodName.equals(method.getName()) && method.getParameterCount() == params.length) {
        return method;
      }
    }
    return null;
  }

  /* Evaluates a Javascript expression and returns the result as a POJO */
  public static Object eval(String expr) {
    return evalNative(expr)[0];
  }
  public static native Object[] evalNative(String expr);

  private static native void installListener();
  private static native Object[] getMessage();
  private static native Object[] getData(Object message);
  private static native void dispatchMessage(Object message);
  private static native void returnResult(Object message, Object returnValue);

  public static native void println(String s);
}
