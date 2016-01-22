package com.javapoly;

import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLClassLoader;

public class JavaPolyClassLoader extends URLClassLoader {

  public JavaPolyClassLoader(URL[] urls) {
    super(urls);
  }

  public void addUrl(String url) throws MalformedURLException{
    super.addURL(new URL(url));
  }
}
