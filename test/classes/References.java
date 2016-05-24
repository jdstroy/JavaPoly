import com.javapoly.reflect.JSValue;

public class References {

  private static JSValue obj = null;

  public static void hold(JSValue objParam) {
    obj = objParam;
    System.gc();
  }

  public static void release() {
    obj = null;
    System.gc();
    System.out.println("Released obj");
  }
}
