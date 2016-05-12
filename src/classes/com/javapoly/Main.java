package com.javapoly;

import java.lang.reflect.*;
import java.util.Arrays;
import javax.tools.*;
import java.nio.file.Path;
import java.nio.file.Files;
import java.nio.file.FileSystems;
import java.io.IOException;
import com.javapoly.invoke.MethodUtils;
import com.javapoly.invoke.ConstructorUtils;

import com.javapoly.reflect.*;

public class Main {
  private static Bridge bridge;
  private static int initialActiveCount = 0;

  public static void main(final String[] args) {
    System.out.println("Java Main started");

    initClassLoader();

    if (args.length > 2 && "system".equals(args[1])) {
      bridge = new SystemBridge(args[2], Integer.parseInt(args[3]));
    } else {
      bridge = new DoppioBridge();
    }

    // Get the initial thread count
    {
      final int activeCount = getActiveThreadCount();
      System.out.println("after bridge Active count:" + activeCount);
      initialActiveCount = activeCount;
    }

    // when running multiple instances of JavaPoly, we want know which javapoly/jvm instance we are working in.
    // set the javapoly instance by id.
    bridge.setJavaPolyInstanceId(args[0]);

    try {
      boolean done = false;
      while (!done) {
        final String messageId = bridge.getMessageId();
        final String messageType = bridge.getMessageType(messageId);
        // System.out.println("Handling message:" + messageType);
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
        case "JAR_PATH_ADD":
          processAddJarPath(messageId);
          break;
        case "TERMINATE":
          processTerminate(messageId);
          break;
        default:
          System.out.println("Unknown message type: " + messageType +", callback will be executed");
          bridge.dispatchMessage(messageId);
        }
      }
    } catch (Exception e) {
      dumpException(e);
    }

    System.out.println("Java Main ended");
  }

  private static void initClassLoader() {
    JavaPolyClassLoader urlClassLoader = new JavaPolyClassLoader(new java.net.URL[0]);
    Thread.currentThread().setContextClassLoader(urlClassLoader);
  }

  private static ThreadGroup getRootThreadGroup(final ThreadGroup tg) {
    final ThreadGroup parent = tg.getParent();
    return (parent == null) ? tg : getRootThreadGroup(parent);
  }

  private static int getActiveThreadCount() {
    final ThreadGroup rootThreadGroup = getRootThreadGroup(Thread.currentThread().getThreadGroup());
    return rootThreadGroup.activeCount();
  }

  private static void processTerminate(final String messageId) {
    final int activeCount = getActiveThreadCount();
    // System.out.println("Active count:" + activeCount + " of " + initialActiveCount);
    final boolean willEnd = activeCount <= initialActiveCount;
    bridge.returnResult(messageId, willEnd);
  }

  private static void  processAddJarPath(String messageId) {
    final Object[] data = bridge.getData(messageId);
    try{
      final String url = (String) data[0];
      JavaPolyClassLoader urlClassLoader = (JavaPolyClassLoader) Thread.currentThread().getContextClassLoader();
      urlClassLoader.addUrl(url);
      bridge.returnResult(messageId, "Add Jar success");
    } catch (Exception e) {
      returnError(messageId, e);
    }
  }

  private static void processClassMethodInvokation(String messageId) {
    final Object[] data = bridge.getData(messageId);
    try {
      final Object returnValue = invokeClassMethod((String) data[0], (String) data[1], (Object[]) data[2]);
      bridge.returnResult(messageId, returnValue);
    } catch (InvocationTargetException ie) {
      returnError(messageId, ie.getCause());
    } catch (Exception e) {
      returnError(messageId, e);
    }
  }

  private static void processClassConstructorInvokation(String messageId) {
    final Object[] data = bridge.getData(messageId);
    try {
      final Object returnValue = invokeClassConstructor((String) data[0], (Object[]) data[1]);
      bridge.returnResult(messageId, returnValue);
    } catch (InvocationTargetException ie) {
      returnError(messageId, ie.getCause());
    } catch (Exception e) {
      returnError(messageId, e);
    }
  }

  private static void processObjMethodInvokation(final String messageId) {
    final Object[] data = bridge.getData(messageId);
    try {
      final Object returnValue = invokeObjectMethod(data[0], (String) data[1], (Object[]) data[2]);
      bridge.returnResult(messageId, returnValue);
    } catch (InvocationTargetException ie) {
      returnError(messageId, ie.getCause());
    } catch (Exception e) {
      returnError(messageId, e);
    }
  }

  private static void processClassFieldRead(final String messageId) {
    final Object[] data = bridge.getData(messageId);
    try {
      final Object returnValue = readClassField((String) data[0], (String) data[1]);
      bridge.returnResult(messageId, returnValue);
    } catch (Exception e) {
      returnError(messageId, e);
    }
  }

  private static void processObjFieldRead(final String messageId) {
    final Object[] data = bridge.getData(messageId);
    try {
      final Object returnValue = readObjectField(data[0], (String) data[1]);
      bridge.returnResult(messageId, returnValue);
    } catch (Exception e) {
      returnError(messageId, e);
    }
  }

  private static void processClassFieldWrite(final String messageId) {
    final Object[] data = bridge.getData(messageId);
    try {
      final Object returnValue = writeClassField((String) data[0], (String) data[1], data[2]);
      bridge.returnResult(messageId, returnValue);
    } catch (Exception e) {
      returnError(messageId, e);
    }
  }

  private static void processObjFieldWrite(final String messageId) {
    final Object[] data = bridge.getData(messageId);
    try {
      final Object returnValue = writeObjectField(data[0], (String) data[1], data[2]);
      bridge.returnResult(messageId, returnValue);
    } catch (Exception e) {
      returnError(messageId, e);
    }
  }

  public static void processClassLoading(String messageId) {
    final Object[] data = bridge.getData(messageId);
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
      bridge.returnResult(messageId, new Object[] { methodNames.toArray(), nonFinalFieldNames.toArray(), finalFieldNames.toArray()});
    } catch (Exception e) {
      returnError(messageId, e);
    }
  }

  public static Object invokeClassMethod(String className, String methodName, Object[] params) throws Exception {
    final Class<?> clazz = Thread.currentThread().getContextClassLoader().loadClass(className);
    final Object returnValue = MethodUtils.invokeStaticMethodFuzzy(clazz, methodName, bridge.reflectParams(params));
    return returnValue;
  }

  public static Object invokeClassConstructor(String className, Object[] params) throws Exception {
    Class<?> clazz = Thread.currentThread().getContextClassLoader().loadClass(className);
    Object returnValue = ConstructorUtils.invokeConstructorFuzzy(clazz, params);
    return returnValue;
  }

  private static Object invokeObjectMethod(Object obj, String methodName, Object[] params) throws Exception {
    Object returnValue = MethodUtils.invokeMethodFuzzy(obj, methodName, params);
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
    final Object[] data = bridge.getData(messageId);
    final String[] stringData = Arrays.copyOf(data, data.length, String[].class);
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
      System.out.println("Compiling: " + Arrays.toString(compileData));

      int result = compiler.run(null, null, null, compileData);
      bridge.returnResult(messageId, result == 0 ? "OK" : "FAIL");
    } catch (final IOException e) {
      returnError(messageId, new RuntimeException("Compilation failed.", e));
    }
  }

  private static void writeToFile(final Path path, final String data) throws IOException{
    // This doesn't work because of https://github.com/plasma-umass/doppio/issues/403
    // Files.write(filePath, scriptText.getBytes());

    try(final java.io.FileWriter fileWriter = new java.io.FileWriter(path.toFile())) {
      fileWriter.write(data);
    }
  }

  private static FlatThrowable flatten(final Throwable throwable) {
    final Throwable cause = throwable.getCause();
    final FlatThrowable flattenedCause =  cause == null ? null : flatten(cause);
    final StackTraceElement[] stackTraceElements = throwable.getStackTrace();
    final String[] stack = new String[stackTraceElements.length];
    for (int i = 0; i <  stackTraceElements.length; i++) {
      stack[i] = stackTraceElements[i].toString();
    }
    return new FlatThrowable(throwable.getClass().getName(), throwable.getMessage(), stack, flattenedCause);
  }

  private static void returnError(final String messageId, final Throwable throwable) {
    bridge.returnErrorFlat(messageId, flatten(throwable));
  }

  public static void dumpException(final Throwable e) {
    e.printStackTrace();
  }

  public static JSValue wrapValue(Object[] res) {
    return bridge.wrapValue((String) res[0], res[1]);
  }

  public static JSValue bridgedEval(final String s) {
    return bridge.eval(s);
  }

}
