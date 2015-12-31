package com.javapoly;

import java.lang.reflect.*;
import javax.tools.*;
import java.nio.file.Path;
import java.nio.file.Files;
import java.nio.file.FileSystems;
import java.io.IOException;

public class Main {

  public static void main(final String[] args) {
    System.out.println("Java Main started");

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
        case "CLASS_FIELD_READ":
          processClassFieldRead(messageId);
          break;
        case "OBJ_FIELD_READ":
          processObjFieldRead(messageId);
          break;
        case "CLASS_FIELD_WRITE":
          processClassFieldWrite(messageId);
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
          System.out.println("Unknown message type, callback will be executed");
          dispatchMessage(messageId);
        }
      }
    } catch (Exception e) {
      dumpException(e);
    }

    System.out.println("Java Main ended");
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

  private static void processClassFieldRead(final String messageId) {
    final Object[] data = getData(messageId);
    Object returnValue = null;
    try {
      returnValue = readClassField((String) data[0], (String) data[1]);
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

  private static void processClassFieldWrite(final String messageId) {
    final Object[] data = getData(messageId);
    Object returnValue = null;
    try {
      returnValue = writeClassField((String) data[0], (String) data[1], data[2]);
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
    final java.util.Set<String> nonFinalFieldNames = new java.util.TreeSet<>();
    final java.util.Set<String> finalFieldNames = new java.util.TreeSet<>();
    try {
      final Class<?> clazz = Thread.currentThread().getContextClassLoader().loadClass((String) data[0]);

      // Add static methods
      final Method[] methods = clazz.getMethods();
      for (final Method method: methods) {
        final int modifiers = method.getModifiers();
        if (Modifier.isStatic(modifiers)) {
          methodNames.add(method.getName());
        }
      }

      // Add static fields
      final Field[] fields = clazz.getFields();
      for (final Field field: fields) {
        final int modifiers = field.getModifiers();
        if (Modifier.isStatic(modifiers)) {
          if (Modifier.isFinal(modifiers)) {
            finalFieldNames.add(field.getName());
          } else {
            nonFinalFieldNames.add(field.getName());
          }
        }
      }
    } catch (Exception e) {
      dumpException(e);
    } finally {
      returnResult(messageId, new Object[] { methodNames.toArray(), nonFinalFieldNames.toArray(), finalFieldNames.toArray()});
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

  private static Object readClassField(String className, String fieldName) throws Exception {
    final Class<?> clazz = Thread.currentThread().getContextClassLoader().loadClass(className);
    final Field field = clazz.getField(fieldName);
    return field.get(null);
  }

  private static Object readObjectField(Object obj, String fieldName) throws Exception {
    final Class<?> clazz = obj.getClass();
    final Field field = clazz.getField(fieldName);
    return field.get(obj);
  }

  private static boolean writeClassField(String className, String fieldName, Object value) throws Exception {
    final Class<?> clazz = Thread.currentThread().getContextClassLoader().loadClass(className);
    final Field field = clazz.getField(fieldName);
    field.set(null, value);
    return true;
  }

  private static boolean writeObjectField(Object obj, String fieldName, Object value) throws Exception {
    final Class<?> clazz = obj.getClass();
    final Field field = clazz.getField(fieldName);
    field.set(obj, value);
    return true;
  }

  public static void processClassCompilation(String messageId) {
    final Object[] data = getData(messageId);
    final String[] stringData = java.util.Arrays.copyOf(data, data.length, String[].class);
    final String className = stringData[0];
    final String pkgName = stringData[1];
    final String storageDir = stringData[2];
    final String scriptText = stringData[3];
    final Path storageDirPath = FileSystems.getDefault().getPath(storageDir);
    final String pkgDir = pkgName.replace(".", "/");
    final Path pkgDirPath = storageDirPath.resolve(pkgDir);
    final Path filePath = pkgDirPath.resolve(className + ".java");

    try {
      // Files.createDirectories(pkgDirPath);
      pkgDirPath.toFile().mkdirs();
      writeToFile(filePath, scriptText);

      final JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
      final String[] compileData = {"-d", storageDir, filePath.toAbsolutePath().toString()};
      System.out.println("Compiling: " + java.util.Arrays.toString(compileData));

      int result = compiler.run(null, null, null, compileData);
      if (result == 0) {
        returnResult(messageId, "Normal compilation.");
      } else {
        returnResult(messageId, "Compilation failed.");
      }
    } catch (final IOException e) {
      dumpException(e);
      returnResult(messageId, "Compilation failed.");
    }
  }

  private static void writeToFile(final Path path, final String data) throws IOException{
    // This doesn't work because of https://github.com/plasma-umass/doppio/issues/403
    // Files.write(filePath, scriptText.getBytes());

    try(final java.io.FileWriter fileWriter = new java.io.FileWriter(path.toFile())) {
      fileWriter.write(data);
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

  private static native String getMessageId();
  private static native Object[] getData(String messageId);
  private static native String getMessageType(String messageId);
  private static native void dispatchMessage(String messageId);
  private static native void returnResult(String messageId, Object returnValue);

  public static void dumpException(final Throwable e) {
    e.printStackTrace();
  }

}
