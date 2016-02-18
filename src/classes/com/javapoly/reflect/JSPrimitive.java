package com.javapoly.reflect;

import com.javapoly.Eval;

public interface JSPrimitive extends JSValue {
  public boolean isNull();

  public double asDouble();

  public int asInteger();

  public long asLong();

  public String asString();
}

