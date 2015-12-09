package javapoly;

public class Main {
  public static void main(final String[] args) {
    println("Java Main started");

    installListener();

    try {
      boolean done = false;
      while(!done) {
        final Object[] message = getMessage();
        dispatchMessage(message[0]);
      }
    } catch (Exception e) {
      println("Exception: " + e);
    }

    println("Java Main ended");
  }

  private static native void installListener();
  private static native Object[] getMessage();
  private static native void dispatchMessage(Object message);

  public static native void println(String s);
}
