package com.javapoly;

import java.net.*;
import java.io.*;
import java.util.HashMap;
import java.util.Map;

final class SimpleHttpServer {

  private final ServerSocket socket;

  SimpleHttpServer(final int port) throws IOException {
    socket = new ServerSocket(port);
  }

  public int getPort() {
    return socket.getLocalPort();
  }

  public void process(ConnectionHandler handler) {
    try {
      final Socket connection = socket.accept();
      handleConnection(connection, handler);
    } catch (IOException e) {
      System.out.println("Exception: " + e.getMessage());
      e.printStackTrace();
    }
  }

  public interface ConnectionHandler {
    void handle(Map<String, String> headers, final String requestMethod, final String requestUrl, final String body, final Socket connection);
  }

  private static void handleConnection(final Socket connection, final ConnectionHandler handler) {
    try {
      final BufferedReader in = new BufferedReader(new InputStreamReader(connection.getInputStream()));

      final String request = in.readLine();
      final Map<String, String> headers = new HashMap<>();
      boolean headerFound = true;
      do {
        final String header = in.readLine();
        if (header != null && (!"".equals(header))) {
          final String[] fields = header.split(":\\s*");
          headers.put(fields[0], fields[1]);
        } else {
          headerFound = false;
        }
      } while (headerFound);

      final String contentLength = headers.get("Content-Length");
      final int expectedLength = contentLength != null ? Integer.parseInt(contentLength) : -1;
      // System.out.println("Headers: " + headers.size());

      StringBuffer bodySb = new StringBuffer();
      int ch = 0;
      int count = 0;
      do {
        ch = in.read();
        if (ch >= 0) {
          bodySb.append((char) ch);
          count++;
        }
      } while (ch >= 0 && (expectedLength == -1 || count < expectedLength));

      // System.out.println("After header: " + bodySb.toString());

      final String[] requestFields = request.split("\\s+");
      handler.handle(headers, requestFields[0], requestFields[1], bodySb.toString(), connection);

      connection.close();
    } catch (IOException e) {
      System.out.println("Exception: " + e.getMessage());
      e.printStackTrace();
    }
  }
}
