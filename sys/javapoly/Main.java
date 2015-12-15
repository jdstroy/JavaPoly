package javapoly;

import java.lang.reflect.*;

public class Main {

  public static void main(final String[] args) {
    println("Java Main started");

    installListener();

    try {
      boolean done = false;
      while (!done) {
        final String messageId = getMessageId();
        final String messageType = getMessageType(messageId);
        // TODO: Create enum
        switch (messageType) {
        case "METHOD_INVOKATION":
          processMethodInvokation(messageId);
          break;
        case "CLASS_LOADING":
          processClassLoading(messageId);
          break;
        default:
          println("Unknown message type, callback will be executed");
          dispatchMessage(messageId);
        }
      }
    } catch (Exception e) {
      dumpException(e);
    }

    println("Java Main ended");
  }

  public static void processMethodInvokation(Object messageId) {
    final Object[] data = getData(messageId);
    Object returnValue = null;
    try {
      returnValue = invokeClassMethod((String) data[0], (String) data[1], (Object[]) data[2]);
    } catch (Exception e) {
      dumpException(e);
    } finally {
      returnResult(messageId, returnValue);
    }
  }

  public static void processClassLoading(Object messageId) {
    final Object[] data = getData(messageId);
    String[] returnValue = null;
    try {
      Class<?> clazz = Thread.currentThread().getContextClassLoader().loadClass((String) data[0]);
      Method[] methods = clazz.getMethods();
      returnValue = new String[methods.length];
      for (int i = 0; i < methods.length; i++) {
        returnValue[i] = methods[i].getName();
      }
    } catch (Exception e) {
      dumpException(e);
    } finally {
      returnResult(messageId, returnValue);
    }
  }

  public static Object invokeClassMethod(String className, String methodName, Object[] params) throws Exception {
    Class<?> clazz = Thread.currentThread().getContextClassLoader().loadClass(className);
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

  private static native void installListener();
  private static native String getMessageId();
  private static native Object[] getData(Object messageId);
  private static native String getMessageType(Object messageId);
  private static native void dispatchMessage(Object messageId);
  private static native void returnResult(Object messageId, Object returnValue);

  public static native void println(String s);

  public static void dumpException(final Exception e) {
    println("Exception: " + e);
    for (StackTraceElement elem : e.getStackTrace()) {
      println(elem.toString());
    }
  }

}
