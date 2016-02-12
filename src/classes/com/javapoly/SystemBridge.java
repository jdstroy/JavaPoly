package com.javapoly;

import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.net.HttpURLConnection;
import javax.json.*;
import java.io.StringReader;
import java.io.StringWriter;
import java.io.OutputStreamWriter;
import java.io.InputStreamReader;
import java.io.BufferedReader;
import java.util.Base64;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.io.IOException;
import java.io.PrintWriter;

class SystemBridge implements Bridge {
  private final Base64.Encoder encoder = Base64.getUrlEncoder();
  private final java.util.concurrent.LinkedBlockingQueue<JsonObject> msgQueue = new java.util.concurrent.LinkedBlockingQueue<>();
  private final java.util.concurrent.LinkedBlockingQueue<JsonObject> responseQueue = new java.util.concurrent.LinkedBlockingQueue<>();
  private final java.util.Hashtable<String, JsonObject> msgTable = new java.util.Hashtable<>();
  private final String secret;
  private final int nodeServerPort;

  SystemBridge(final String secret, final int nodeServerPort) {
    this.secret = secret;
    this.nodeServerPort = nodeServerPort;

    try {
      final SimpleHttpServer srv = new SimpleHttpServer(0);
      informPort(srv.getPort());
      new Thread(() -> {
        while(processRequest(srv));
      }).start();

    } catch (IOException e) {
      System.out.println("Exception: " + e.getMessage());
      e.printStackTrace();
    }

  }

  private void informPort(int port) {
    // System.out.println(String.format("::bridgePort=%d::", srv.getPort()));
    try {
      final URL url = new URL("http://localhost:"+nodeServerPort+"/");
      final HttpURLConnection connection = (HttpURLConnection) url.openConnection();
      connection.setRequestMethod("POST");
      connection.setRequestProperty("JVM-PORT", "" + port);
      connection.setRequestProperty("TOKEN", makeToken());
      connection.setUseCaches(false);

      final BufferedReader in = new BufferedReader( new InputStreamReader( connection.getInputStream()));
      String decodedString;
      while ((decodedString = in.readLine()) != null) {
        System.out.println(decodedString);
      }
      in.close();

    } catch (IOException e) {
      e.printStackTrace();
    }
  }

  private boolean processRequest(final SimpleHttpServer srv) {
    srv.process((headers, requestMethod, requestUrl, body, connection) -> {
      try {
        final JsonObject jsonObj = Json.createReader(new StringReader(body)).readObject();
        if (verify(jsonObj.getString("token"), secret)) {
          msgQueue.add(jsonObj);
        } else {
          System.err.println("Invalid token, ignoring message");
        }
        final PrintWriter out = new PrintWriter(connection.getOutputStream(), true);
        out.println("HTTP/1.0 200");
        final JsonObject msgObj = responseQueue.take();
        final String msg = toString(msgObj);
        out.println("Content-Length: " + msg.length());
        out.println("Connection: close");
        out.println("");
        out.println(msg);
        out.flush();
        out.close();
      } catch (InterruptedException | IOException e) {
        System.out.println("Exception: " + e.getMessage());
        e.printStackTrace();
      }
    });
    return true;
  }

  private String tokenize(final String salt, final String secret) throws NoSuchAlgorithmException{
    final MessageDigest crypt = MessageDigest.getInstance("SHA-1");
    crypt.reset();
    crypt.update((salt + '-' + secret).getBytes());
    final String expected = encoder.encodeToString(crypt.digest());
    final int indexOfPadStart = expected.indexOf('=');
    final String expectedTrimmed = indexOfPadStart >= 0 ? expected.substring(0, indexOfPadStart) : expected;
    return expectedTrimmed;
  }

  private String makeToken() {
    final String salt = ""+Math.random();
    try {
      return salt + "-" + tokenize(salt, secret);
    } catch(java.security.NoSuchAlgorithmException e) {
      e.printStackTrace();
      return "failedToken";
    }
  }

  private boolean verify(final String saltedToken, final String secret) {
    final int separatorPos = saltedToken.indexOf('-');
    final String salt = saltedToken.substring(0, separatorPos);
    final String token = saltedToken.substring(separatorPos+1);

    try {
      return tokenize(salt, secret).equals(token);
    } catch(java.security.NoSuchAlgorithmException e) {
      e.printStackTrace();
      return false;
    }
  }

  public String getMessageId() {
    try {
      final JsonObject msg = msgQueue.take();
      final String id = msg.getString("id");
      msgTable.put(id, msg);
      return id;
    } catch (final InterruptedException ie) {
      throw new IllegalStateException("Unexpected exception", ie);
    }
  }

  private Object toJavaObj(JsonValue val) {
    if (val instanceof JsonString) {
      return ((JsonString) val).getString();
    } else if (val instanceof JsonArray) {
      final JsonArray jsArray = (JsonArray) val;
      return jsArray.stream().map(e -> toJavaObj(e)).toArray();
    } else {
      System.out.println("  TODO val: " + val);
      return "TODO";
    }
  }

  public Object[] getData(String messageId) {
    final JsonObject jsonObj = msgTable.get(messageId);
    return (Object[]) toJavaObj(jsonObj.getJsonArray("data"));
  }

  public String getMessageType(String messageId) {
    final JsonObject jsonObj = msgTable.get(messageId);
    return jsonObj.getString("messageType");
  }

  public void dispatchMessage(String messageId) {
    /*
    // TODO
    this.client.send(messageId);
    */
  }

  private JsonValue toJsonObj(Object obj) {
    if (obj == null) {
      return JsonValue.NULL;
    } else {
      final JsonArrayBuilder arrayBuilder = Json.createArrayBuilder();
      if (obj instanceof Integer) {
        arrayBuilder.add((Integer) obj);
        return arrayBuilder.build().getJsonNumber(0);
      } else if (obj instanceof String) {
        arrayBuilder.add((String) obj);
        return arrayBuilder.build().getJsonString(0);
      } else if (obj instanceof Boolean) {
        return ((Boolean) obj) ? JsonValue.TRUE : JsonValue.FALSE;
      } else if (obj instanceof Object[]) {
        final Object[] arr = (Object[]) obj;
        for (int i = 0; i < arr.length; i++) {
          arrayBuilder.add(toJsonObj(arr[i]));
        }
        return arrayBuilder.build();
      } else {
        System.err.println("Value type not yet handled by this implementation: " + obj);
        throw new RuntimeException("Value type not yet handled by this implementation: " + obj);
      }
    }
  }
  public void returnResult(String messageId, Object returnValue) {
    final JsonValue returnObj = toJsonObj(returnValue);
    final JsonObject resultObj = Json.createObjectBuilder().add("success", true).add("returnValue", returnObj).build();
    final JsonObject msgObj = Json.createObjectBuilder()
      .add("id", messageId)
      .add("token", makeToken())
      .add("result", resultObj).build();
    responseQueue.add(msgObj);
  }

  private JsonValue toJsonObj(FlatThrowable ft) {
    if (ft == null) {
      return JsonValue.NULL;
    } else {
      final JsonArrayBuilder stackArrayBuilder = Json.createArrayBuilder();
      for (int i=0; i< ft.stack.length; i++) {
        stackArrayBuilder.add(ft.stack[i]);
      }
      return Json.createObjectBuilder()
        .add("name", ft.name)
        .add("message", ft.message)
        .add("stack", stackArrayBuilder.build())
        .add("causedBy", toJsonObj(ft.causedBy))
        .build();
    }
  }

  private String toString(JsonStructure val) {
    final StringWriter msgWriter = new StringWriter();
    final JsonWriter msgJsonWriter = Json.createWriter(msgWriter);
    msgJsonWriter.write(val);
    msgJsonWriter.close();
    return msgWriter.toString();
  }

  public void returnErrorFlat(String messageId, FlatThrowable ft) {
    final JsonValue causeObj = toJsonObj(ft);
    final JsonObject resultObj = Json.createObjectBuilder().add("success", false).add("cause", causeObj).build();
    final JsonObject msgObj = Json.createObjectBuilder()
      .add("id", messageId)
      .add("token", makeToken())
      .add("result", resultObj).build();
    responseQueue.add(msgObj);
  }

  public void setJavaPolyInstanceId(String javapolyId) {
    // TODO
  }

}

