import com.javapoly.reflect.SystemJSValue;

public class References {

  private static SystemJSValue obj = null;

  public static void hold(SystemJSValue objParam) {
    obj = objParam;
    System.gc();
  }

  public static void release() {
    obj = null;
    System.gc();
    System.out.println("Released obj");
  }
}
