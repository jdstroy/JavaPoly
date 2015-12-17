package javapoly;

import java.lang.reflect.*;
import javax.tools.*;

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
        case "FILE_COMPILE":
          processClassCompilation(messageId);
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

  public static void processMethodInvokation(String messageId) {
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

  public static void processClassLoading(String messageId) {
    final Object[] data = getData(messageId);
    final java.util.Set<String> methodNames = new java.util.TreeSet<>();
    try {
      final Class<?> clazz = Thread.currentThread().getContextClassLoader().loadClass((String) data[0]);
      final Method[] methods = clazz.getMethods();
      for (int i = 0; i < methods.length; i++) {
        final Method method = methods[i];
        final int modifiers = method.getModifiers();
        if (Modifier.isPublic(modifiers) && Modifier.isStatic(modifiers)) {
          methodNames.add(method.getName());
        }
      }
    } catch (Exception e) {
      dumpException(e);
    } finally {
      returnResult(messageId, methodNames.toArray());
    }
  }

  public static Object invokeClassMethod(String className, String methodName, Object[] params) throws Exception {
    Class<?> clazz = Thread.currentThread().getContextClassLoader().loadClass(className);
    Method[] methods = clazz.getMethods();
    Method suitableMethod = matchMethod(methods, methodName, params);
    Object returnValue = suitableMethod.invoke(null, params);
    return returnValue;
  }

  public static void processClassCompilation(String messageId) {
    final Object[] data = getData(messageId);
    String[] stringData = java.util.Arrays.copyOf(data, data.length, String[].class);

    JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
    int result = compiler.run(null, null, null, stringData);
    if (result == 0) {
      returnResult(messageId, "Normal compilation.");
    } else {
      returnResult(messageId, "Compilation failed.");
    }
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
  private static native Object[] getData(String messageId);
  private static native String getMessageType(String messageId);
  private static native void dispatchMessage(String messageId);
  private static native void returnResult(String messageId, Object returnValue);

  public static native void println(String s);

  public static void dumpException(final Throwable e) {
    final java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
    try (final java.io.PrintWriter pr = new java.io.PrintWriter(baos)) {
      e.printStackTrace(pr);
      pr.flush();
    } finally {
      println(baos.toString());
    }
  }

}
