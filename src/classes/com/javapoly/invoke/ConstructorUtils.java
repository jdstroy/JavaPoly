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

import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Modifier;

import com.javapoly.invoke.internal.ArrayUtils;
import com.javapoly.invoke.internal.ClassUtils;
import com.javapoly.invoke.internal.MemberUtils;

/**
 * <p> Utility reflection methods focused on constructors, modeled after
 * {@link MethodUtils}. </p>
 *
 * <h3>Known Limitations</h3> <h4>Accessing Public Constructors In A Default
 * Access Superclass</h4> <p>There is an issue when invoking {@code public} constructors
 * contained in a default access superclass. Reflection correctly locates these
 * constructors and assigns them as {@code public}. However, an
 * {@link IllegalAccessException} is thrown if the constructor is
 * invoked.</p>
 *
 * <p>{@link ConstructorUtils} contains a workaround for this situation: it
 * will attempt to call {@link java.lang.reflect.AccessibleObject#setAccessible(boolean)} on this constructor. If this
 * call succeeds, then the method can be invoked as normal. This call will only
 * succeed when the application has sufficient security privileges. If this call
 * fails then a warning will be logged and the method may fail.</p>
 *
 * @since 2.5
 */
public class ConstructorUtils {

  /**
   * <p>ConstructorUtils instances should NOT be constructed in standard
   * programming. Instead, the class should be used as
   * {@code ConstructorUtils.invokeConstructor(cls, args)}.</p>
   *
   * <p>This constructor is {@code public} to permit tools that require a JavaBean
   * instance to operate.</p>
   */
  public ConstructorUtils() {
      super();
  }

  /**
   * <p>Checks if the specified constructor is accessible.</p>
   *
   * <p>This simply ensures that the constructor is accessible.</p>
   *
   * @param <T> the constructor type
   * @param ctor  the prototype constructor object, not {@code null}
   * @return the constructor, {@code null} if no matching accessible constructor found
   * @see java.lang.SecurityManager
   * @throws NullPointerException if {@code ctor} is {@code null}
   */
  public static <T> Constructor<T> getAccessibleConstructor(final Constructor<T> ctor) {
      return MemberUtils.isAccessible(ctor)
              && isAccessible(ctor.getDeclaringClass()) ? ctor : null;
  }

  /**
   * Learn whether the specified class is generally accessible, i.e. is
   * declared in an entirely {@code public} manner.
   * @param type to check
   * @return {@code true} if {@code type} and any enclosing classes are
   *         {@code public}.
   */
  private static boolean isAccessible(final Class<?> type) {
      Class<?> cls = type;
      while (cls != null) {
          if (!Modifier.isPublic(cls.getModifiers())) {
              return false;
          }
          cls = cls.getEnclosingClass();
      }
      return true;
  }

  // --------------
  // Fuzzy matching

  public static <T> T invokeConstructorFuzzy(final Class<T> cls, Object... args)
          throws NoSuchMethodException, IllegalAccessException, InvocationTargetException,
          InstantiationException {
      args = ArrayUtils.nullToEmpty(args);
      final Class<?>[] parameterTypes = ClassUtils.toClass(args);
      final Constructor<T> ctor = getMatchingAccessibleConstructorFuzzy(cls, parameterTypes, args);
      if (ctor == null) {
          throw new NoSuchMethodException(
              "No such accessible constructor on object: " + cls.getName());
      }
      args = MethodUtils.castArgumentsForMethodFuzzy(parameterTypes, ctor.getParameterTypes(), args);
      return ctor.newInstance(args);
  }

  public static <T> Constructor<T> getMatchingAccessibleConstructorFuzzy(final Class<T> cls,
      final Class<?>[] parameterTypes, Object[] args) {
    // see if we can find the constructor directly
    // most of the time this works and it's much faster
    try {
      final Constructor<T> ctor = cls.getConstructor(parameterTypes);
      MemberUtils.setAccessibleWorkaround(ctor);
      return ctor;
    } catch (final NoSuchMethodException e) { // NOPMD - Swallow
    }
    Constructor<T> result = null;
    /*
     * (1) Class.getConstructors() is documented to return Constructor<T> so as
     * long as the array is not subsequently modified, everything's fine.
     */
    final Constructor<?>[] ctors = cls.getConstructors();

    // return best match:
    for (Constructor<?> ctor : ctors) {
      // compare parameters
      if (MethodUtils.isAssignableFuzzy(parameterTypes, ctor.getParameterTypes(), args)) {
        // get accessible version of constructor
        ctor = getAccessibleConstructor(ctor);
        if (ctor != null) {
          MemberUtils.setAccessibleWorkaround(ctor);
          if (result == null
                || MemberUtils.compareParameterTypes(ctor.getParameterTypes(), result
                        .getParameterTypes(), parameterTypes) < 0) {
            final Constructor<T> constructor = (Constructor<T>)ctor;
            result = constructor;
          }
        }
      }
    }
    return result;
  }

  // Fuzzy matching
  // --------------
}
