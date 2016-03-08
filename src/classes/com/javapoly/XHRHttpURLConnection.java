package com.javapoly;

import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLConnection;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.Map;
import java.util.List;
import java.util.Iterator;

class XHRHttpURLConnection extends HttpURLConnection {
  private final AtomicBoolean connectionStarted = new AtomicBoolean(false);
  private final CompletableFuture<XHRResponse> responseFuture = new CompletableFuture<>();

  XHRHttpURLConnection(final URL url) {
    super(url);
  }

  @Override public void connect() {
    if (!connectionStarted.get()) {
      connectionStarted.set(true);
      new Thread() {
        public void run() {
          final Map<String, List<String>> requestPropertyMap= getRequestProperties();
          final Iterator<String> requestPropretyKeys = requestPropertyMap.keySet().iterator();
          final String[] requestProperties = new String[requestPropertyMap.size() * 2];
          {
            int i = 0;
            while (requestPropretyKeys.hasNext()) {
              final String key = requestPropretyKeys.next();
              requestProperties[i++] = key;
              requestProperties[i++] = String.join(", ", requestPropertyMap.get(key));
            }
          }
          final XHRResponse response= getResponse(requestProperties, getRequestMethod(), getURL().toString());
          responseFuture.complete(response);
          XHRHttpURLConnection.this.connected = true;
        }
      }.start();
    }
  }

  @Override public String getHeaderField(final String name) {
    connect();

    try {
      return responseFuture.get().getHeaderField(name);
    } catch (final InterruptedException ie) {
      throw new RuntimeException("Interrupted while waiting for connection", ie);
    } catch (final ExecutionException ee) {
      throw new RuntimeException("Error connecting to URL", ee);
    }
  }

  @Override public InputStream getInputStream() throws IOException {
    connect();

    try {
      final byte[] responseBytes = responseFuture.get().getResponseBytes();
      return new java.io.ByteArrayInputStream(responseBytes);
    } catch (final InterruptedException ie) {
      throw new RuntimeException("Interrupted while waiting for connection", ie);
    } catch (final ExecutionException ee) {
      throw new RuntimeException("Error connecting to URL", ee);
    }
  }

  @Override public void disconnect() {
    // TODO
    System.out.println("disconnect request to: " + getURL());
  }

  @Override public boolean usingProxy() {
    return false;
  }

  @Override public final void setRequestProperty(String field, String newValue) {
    // TODO
    System.out.println("Need to set request property: " + field + ": " + newValue);
  }

  private static native XHRResponse getResponse(final String[] requestProperties, final String method, final String url);
}
