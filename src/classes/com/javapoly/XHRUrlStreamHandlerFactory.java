package com.javapoly;

import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLConnection;
import java.net.URLStreamHandler;
import java.net.URLStreamHandlerFactory;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

public class XHRUrlStreamHandlerFactory implements URLStreamHandlerFactory {
  public static void register() {
    URL.setURLStreamHandlerFactory(new XHRUrlStreamHandlerFactory());
  }

  public URLStreamHandler createURLStreamHandler(String protocol) {
    // TODO: support https
    if ("http".equals(protocol)) {
      return new URLStreamHandler() {
        public HttpURLConnection openConnection(URL url) {
          return new XHRHttpURLConnection(url);
        }
      };
    } else {
      return null;
    }
  }

}
