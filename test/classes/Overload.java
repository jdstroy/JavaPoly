public class Overload {

  private String text;

  public Overload() {
    this.text = "empty";
  }

  public Overload(String name) {
    this.text = "string:" + name;
  }

  public Overload(Integer number) {
    this.text = "number:" + number;
  }

  public static String staticMethod(String name) {
    return "string:" + name;
  }

  public static String staticMethod(Integer number) {
    return "number:" + number;
  }

  public String method(String name) {
    return "string:" + name;
  }

  public String method(Integer number) {
    return "number:" + number;
  }

  public String getText() {
    return text;
  }
}