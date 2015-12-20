package com.javapoly;

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
        case "CLASS_METHOD_INVOCATION":
          processClassMethodInvokation(messageId);
          break;
        case "CLASS_CONSTRUCTOR_INVOCATION":
          processClassConstructorInvokation(messageId);
          break;
        case "OBJ_METHOD_INVOCATION":
          processObjMethodInvokation(messageId);
          break;
        case "OBJ_FIELD_READ":
          processObjFieldRead(messageId);
          break;
        case "OBJ_FIELD_WRITE":
          processObjFieldWrite(messageId);
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

  private static void processClassMethodInvokation(String messageId) {
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

  private static void processClassConstructorInvokation(String messageId) {
    final Object[] data = getData(messageId);
    Object returnValue = null;
    try {
      returnValue = invokeClassConstructor((String) data[0], (Object[]) data[1]);
    } catch (Exception e) {
      dumpException(e);
    } finally {
      returnResult(messageId, returnValue);
    }
  }

  private static void processObjMethodInvokation(final String messageId) {
    final Object[] data = getData(messageId);
    Object returnValue = null;
    try {
      returnValue = invokeObjectMethod(data[0], (String) data[1], (Object[]) data[2]);
    } catch (Exception e) {
      dumpException(e);
    } finally {
      returnResult(messageId, returnValue);
    }
  }

  private static void processObjFieldRead(final String messageId) {
    final Object[] data = getData(messageId);
    Object returnValue = null;
    try {
      returnValue = readObjectField(data[0], (String) data[1]);
    } catch (Exception e) {
      dumpException(e);
    } finally {
      returnResult(messageId, returnValue);
    }
  }

  private static void processObjFieldWrite(final String messageId) {
    final Object[] data = getData(messageId);
    Object returnValue = null;
    try {
      returnValue = writeObjectField(data[0], (String) data[1], data[2]);
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

  public static Object invokeClassConstructor(String className, Object[] params) throws Exception {
    final Class<?> clazz = Thread.currentThread().getContextClassLoader().loadClass(className);
    final Constructor suitableConstructor = matchConstructor(clazz.getConstructors(), params);
    final Object returnValue = suitableConstructor.newInstance(params);
    return returnValue;
  }

  private static Object invokeObjectMethod(Object obj, String methodName, Object[] params) throws Exception {
    final Class<?> clazz = obj.getClass();
    final Method[] methods = clazz.getMethods();
    final Method suitableMethod = matchMethod(methods, methodName, params);
    Object returnValue = suitableMethod.invoke(obj, params);
    return returnValue;
  }

  private static Object readObjectField(Object obj, String fieldName) throws Exception {
    final Class<?> clazz = obj.getClass();
    final Field field = clazz.getField(fieldName);
    return field.get(obj);
  }

  private static boolean writeObjectField(Object obj, String fieldName, Object value) throws Exception {
    final Class<?> clazz = obj.getClass();
    final Field field = clazz.getField(fieldName);
    field.set(obj, value);
    return true;
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

  // TODO: method and constructor matching need to be more smart. Issue #40
  private static Method matchMethod(final Method[] methods, final String methodName, final Object[] params) {
    for (Method method : methods) {
      if (methodName.equals(method.getName()) && method.getParameterCount() == params.length) {
        return method;
      }
    }
    return null;
  }

  private static Constructor matchConstructor(final Constructor[] constructors, final Object[] params) {
    for (Constructor constructor : constructors) {
      if (constructor.getParameterCount() == params.length) {
        return constructor;
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
