package com.javapoly;

import java.net.URI;
import java.net.URISyntaxException;
import org.java_websocket.handshake.ServerHandshake;
import org.java_websocket.client.*;
import javax.json.*;
import java.io.StringReader;
import java.io.StringWriter;
import java.util.Base64;
import java.security.MessageDigest;

class SystemBridge implements Bridge {
  private final WebSocketClient client;
  private final Base64.Encoder encoder = Base64.getUrlEncoder();
  private final java.util.concurrent.LinkedBlockingQueue<JsonObject> msgQueue = new java.util.concurrent.LinkedBlockingQueue<>();
  private final java.util.Hashtable<String, JsonObject> msgTable = new java.util.Hashtable<>();

  SystemBridge(final int port, final String secret) {
    // System.out.println("Starting system bridge on port: " + port);
    try {
      this.client = new WebSocketClient(new URI("ws://localhost:" + port + "/")) {
        public void onOpen( ServerHandshake handshakedata ) {
          // System.out.println("On open");
        }

        public void onMessage( String message ) {
          final JsonObject jsonObj = Json.createReader(new StringReader(message)).readObject();

          if (verify(jsonObj.getString("token"), secret)) {
            msgQueue.add(jsonObj);
          } else {
            System.err.println("Invalid token, ignoring message");
          }
        }

        public void onClose( int code, String reason, boolean remote ) {
          System.out.println("On close");
        }

        public void onError( Exception ex ) {
          System.out.println("Error in WS client: ");
          ex.printStackTrace();
        }

      };
      new Thread(client).start();
   } catch (final URISyntaxException use) {
     throw new IllegalStateException("Unexpected exception", use);
   }

    /*
    final WebSocketContainer container = ContainerProvider.getWebSocketContainer();
    container.conntectToServer(MyClientEndpoint.class, new URI("ws://localhost:8080/tictactoeserver/endpoint"));
    */
  }

  private boolean verify(String saltedToken, String secret) {
    final int separatorPos = saltedToken.indexOf('-');
    final String salt = saltedToken.substring(0, separatorPos);
    final String token = saltedToken.substring(separatorPos+1);

    try {
      final MessageDigest crypt = MessageDigest.getInstance("SHA-1");
      crypt.reset();
      crypt.update((salt + '-' + secret).getBytes());
      final String expected = encoder.encodeToString(crypt.digest());
      final int indexOfPadStart = expected.indexOf('=');
      final String expectedTrimmed = indexOfPadStart >= 0 ? expected.substring(0, indexOfPadStart) : expected;

      return expectedTrimmed.equals(token);
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
    // TODO
    this.client.send(messageId);
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
    final JsonObject msgObj = Json.createObjectBuilder().add("id", messageId).add("result", resultObj).build();
    final String msg = toString(msgObj);
    this.client.send(msg);
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
    final JsonObject msgObj = Json.createObjectBuilder().add("id", messageId).add("result", resultObj).build();
    final String msg = toString(msgObj);
    this.client.send(msg);
  }

  public void setJavaPolyInstanceId(String javapolyId) {
    // TODO
  }

}

