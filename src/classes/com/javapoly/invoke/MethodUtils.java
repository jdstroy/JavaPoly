// Forked from apache.common.reflect

/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.javapoly.invoke;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;

import com.javapoly.invoke.internal.ArrayUtils;
import com.javapoly.invoke.internal.ClassUtils;
import com.javapoly.invoke.internal.MemberUtils;

/**
 * <p>Utility reflection methods focused on {@link Method}s, originally from Commons BeanUtils.
 * Differences from the BeanUtils version may be noted, especially where similar functionality
 * already existed within Lang.
 * </p>
 *
 * <h3>Known Limitations</h3>
 * <h4>Accessing Public Methods In A Default Access Superclass</h4>
 * <p>There is an issue when invoking {@code public} methods contained in a default access superclass on JREs prior to 1.4.
 * Reflection locates these methods fine and correctly assigns them as {@code public}.
 * However, an {@link IllegalAccessException} is thrown if the method is invoked.</p>
 *
 * <p>{@link MethodUtils} contains a workaround for this situation.
 * It will attempt to call {@link java.lang.reflect.AccessibleObject#setAccessible(boolean)} on this method.
 * If this call succeeds, then the method can be invoked as normal.
 * This call will only succeed when the application has sufficient security privileges.
 * If this call fails then the method may fail.</p>
 *
 * @since 2.5
 */
public class MethodUtils {

    /**
     * <p>{@link MethodUtils} instances should NOT be constructed in standard programming.
     * Instead, the class should be used as
     * {@code MethodUtils.getAccessibleMethod(method)}.</p>
     *
     * <p>This constructor is {@code public} to permit tools that require a JavaBean
     * instance to operate.</p>
     */
    public MethodUtils() {
        super();
    }

    /**
     * <p>Returns an accessible method (that is, one that can be invoked via
     * reflection) that implements the specified Method. If no such method
     * can be found, return {@code null}.</p>
     *
     * @param method The method that we wish to call
     * @return The accessible method
     */
    public static Method getAccessibleMethod(Method method) {
        if (!MemberUtils.isAccessible(method)) {
            return null;
        }
        // If the declaring class is public, we are done
        final Class<?> cls = method.getDeclaringClass();
        if (Modifier.isPublic(cls.getModifiers())) {
            return method;
        }
        final String methodName = method.getName();
        final Class<?>[] parameterTypes = method.getParameterTypes();

        // Check the implemented interfaces and subinterfaces
        method = getAccessibleMethodFromInterfaceNest(cls, methodName,
                parameterTypes);

        // Check the superclass chain
        if (method == null) {
            method = getAccessibleMethodFromSuperclass(cls, methodName,
                    parameterTypes);
        }
        return method;
    }

    /**
     * <p>Returns an accessible method (that is, one that can be invoked via
     * reflection) by scanning through the superclasses. If no such method
     * can be found, return {@code null}.</p>
     *
     * @param cls Class to be checked
     * @param methodName Method name of the method we wish to call
     * @param parameterTypes The parameter type signatures
     * @return the accessible method or {@code null} if not found
     */
    private static Method getAccessibleMethodFromSuperclass(final Class<?> cls,
            final String methodName, final Class<?>... parameterTypes) {
        Class<?> parentClass = cls.getSuperclass();
        while (parentClass != null) {
            if (Modifier.isPublic(parentClass.getModifiers())) {
                try {
                    return parentClass.getMethod(methodName, parameterTypes);
                } catch (final NoSuchMethodException e) {
                    return null;
                }
            }
            parentClass = parentClass.getSuperclass();
        }
        return null;
    }

    /**
     * <p>Returns an accessible method (that is, one that can be invoked via
     * reflection) that implements the specified method, by scanning through
     * all implemented interfaces and subinterfaces. If no such method
     * can be found, return {@code null}.</p>
     *
     * <p>There isn't any good reason why this method must be {@code private}.
     * It is because there doesn't seem any reason why other classes should
     * call this rather than the higher level methods.</p>
     *
     * @param cls Parent class for the interfaces to be checked
     * @param methodName Method name of the method we wish to call
     * @param parameterTypes The parameter type signatures
     * @return the accessible method or {@code null} if not found
     */
    private static Method getAccessibleMethodFromInterfaceNest(Class<?> cls,
            final String methodName, final Class<?>... parameterTypes) {
        // Search up the superclass chain
        for (; cls != null; cls = cls.getSuperclass()) {

            // Check the implemented interfaces of the parent class
            final Class<?>[] interfaces = cls.getInterfaces();
            for (int i = 0; i < interfaces.length; i++) {
                // Is this interface public?
                if (!Modifier.isPublic(interfaces[i].getModifiers())) {
                    continue;
                }
                // Does the method exist on this interface?
                try {
                    return interfaces[i].getDeclaredMethod(methodName,
                            parameterTypes);
                } catch (final NoSuchMethodException e) { // NOPMD
                    /*
                     * Swallow, if no method is found after the loop then this
                     * method returns null.
                     */
                }
                // Recursively check our parent interfaces
                final Method method = getAccessibleMethodFromInterfaceNest(interfaces[i],
                        methodName, parameterTypes);
                if (method != null) {
                    return method;
                }
            }
        }
        return null;
    }

    // --------------
    // Fuzzy matching

    public static Object invokeMethodFuzzy(final Object object, final String methodName, Object... args)
            throws NoSuchMethodException, IllegalAccessException, InvocationTargetException {
        args = ArrayUtils.nullToEmpty(args);
        final Class<?>[] parameterTypes = ClassUtils.toClass(args);
        final Method method = getMatchingAccessibleMethodFuzzy(object.getClass(),
                methodName, parameterTypes, args);
        if (method == null) {
            throw new NoSuchMethodException("No such accessible method: "
                    + methodName + "() on object: "
                    + object.getClass().getName());
        }
        args = castArgumentsForMethodFuzzy(parameterTypes, method.getParameterTypes(), args);
        return method.invoke(object, args);
    }

    public static Object invokeStaticMethodFuzzy(final Class<?> cls, final String methodName, Object... args)
            throws NoSuchMethodException, IllegalAccessException, InvocationTargetException {
        args = ArrayUtils.nullToEmpty(args);
        final Class<?>[] parameterTypes = ClassUtils.toClass(args);
        final Method method = getMatchingAccessibleMethodFuzzy(cls, methodName,
                parameterTypes, args);
        if (method == null) {
            throw new NoSuchMethodException("No such accessible method: "
                    + methodName + "() on class: " + cls.getName());
        }
        args = castArgumentsForMethodFuzzy(parameterTypes, method.getParameterTypes(), args);
        return method.invoke(null, args);
    }

	public static Method getMatchingAccessibleMethodFuzzy(final Class<?> cls,
            final String methodName, final Class<?>[] parameterTypes, Object[] args) {
        try {
            final Method method = cls.getMethod(methodName, parameterTypes);
            MemberUtils.setAccessibleWorkaround(method);
            return method;
        } catch (final NoSuchMethodException e) { // NOPMD - Swallow the exception
        }
        // search through all methods
        Method bestMatch = null;
        final Method[] methods = cls.getMethods();
        for (final Method method : methods) {
            // compare name and parameters
            if (method.getName().equals(methodName) && isAssignableFuzzy(parameterTypes, method.getParameterTypes(), args)) {
                // get accessible version of method
                final Method accessibleMethod = getAccessibleMethod(method);
                if (accessibleMethod != null && (bestMatch == null || MemberUtils.compareParameterTypes(
                            accessibleMethod.getParameterTypes(),
                            bestMatch.getParameterTypes(),
                            parameterTypes) < 0)) {
                        bestMatch = accessibleMethod;
                 }
            }
        }
        if (bestMatch != null) {
            MemberUtils.setAccessibleWorkaround(bestMatch);
        }
        return bestMatch;
    }

    public static Object[] castArgumentsForMethodFuzzy(Class<?>[] classArray, Class<?>[] toClassArray, Object[] objs) {
    	int length = objs.length;
    	Object[] result = new Object[length];
    	for (int i = 0; i < length; i++) {
    		result[i] = castObject(classArray[i], toClassArray[i], objs[i]);
    	}
		return result;
	}

	public static boolean isAssignableFuzzy(Class<?>[] classArray, Class<?>[] toClassArray, Object[] objs) {
        if (ArrayUtils.isSameLength(classArray, toClassArray) == false) {
            return false;
        }
        if (classArray == null) {
            classArray = ArrayUtils.EMPTY_CLASS_ARRAY;
        }
        if (toClassArray == null) {
            toClassArray = ArrayUtils.EMPTY_CLASS_ARRAY;
        }
        for (int i = 0; i < classArray.length; i++) {
            if (isAssignableFuzzy(classArray[i], toClassArray[i], objs[i]) == false) {
                return false;
            }
        }
        return true;
    }

	private static Object castObject(Class<?> cls, Class<?> toClass, Object object) {
		// Perform strict match
		if (ClassUtils.isAssignable(cls, toClass)) {
			return object;
		}

		// Consider JS specific conversion
		// One symbol String can be interpreted as char
        if (cls == String.class && ((String) object).length() == 1) {
        	return ((String) object).charAt(0);
        }

        // Every JS number wrapped and passed to Java as Double
        if (object instanceof Double) {
        	double d = (Double) object;
        	if (toClass == Byte.class || toClass == Byte.TYPE) {
        		byte val = (byte) d;
        		if (((double) val) == d) {
        			return val;
        		}
        	}
        	if (toClass == Short.class || toClass == Short.TYPE) {
        		short val = (short) d;
        		if (val == d) {
        			return val;
        		}
        	}
        	if (toClass == Integer.class || toClass == Integer.TYPE) {
        		int val = (int) d;
        		if (val == d) {
        			return val;
        		}
        	}
        	if (toClass == Long.class || toClass == Long.TYPE) {
        		long val = (long) d;
        		if (val == d) {
        			return val;
        		}
        	}
        	if (toClass == Float.class || toClass == Float.TYPE) {
        		float val = (float) d;
        		if (val == d) {
        			return val;
        		}
        	}
        }

		return null;
	}

	public static boolean isAssignableFuzzy(Class<?> cls, final Class<?> toClass, final Object object) {
		// Perform strict match
		if (ClassUtils.isAssignable(cls, toClass)) {
			return true;
		}

		// Consider JS specific conversion
		// One symbol String can be interpreted as char
		if (toClass == Character.class || toClass == Character.TYPE) {
	        if (cls == String.class && ((String) object).length() == 1) {
	        	return true;
	        }
		}

        // Every JS number wrapped and passed to Java as Double
        if (object instanceof Double) {
        	double d = (Double) object;
    		// Cast it back and forth to make sure it fits well
        	if (toClass == Byte.class || toClass == Byte.TYPE) {
        		if (((double) ((byte) d)) == d) {
        			return true;
        		}
        	}
        	if (toClass == Short.class || toClass == Short.TYPE) {
        		if (((double) ((short) d)) == d) {
        			return true;
        		}
        	}
        	if (toClass == Integer.class || toClass == Integer.TYPE) {
        		if (((double) ((int) d)) == d) {
        			return true;
        		}
        	}
        	if (toClass == Long.class || toClass == Long.TYPE) {
        		if (((double) ((long) d)) == d) {
        			return true;
        		}
        	}
        	if (toClass == Float.class || toClass == Float.TYPE) {
        		if (((double) ((float) d)) == d) {
        			return true;
        		}
        	}
        }

        return false;
    }

    // Fuzzy matching
    // --------------
}
