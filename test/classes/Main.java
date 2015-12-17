public class Main {
  public static String test() {
    return "test message";
  }

  public static void main(String args[]) {
    System.out.println("hello world2");
  }

  /* A function that checks the length of a string. The idea is to return some boolean, to test the wrapping of
   * primitive boolean values */
  public static boolean checkLength(final String str, final int n) {
    return str.length() == n;
  }

  /* private method defined only to check accessibilty */
  private static void privateMethod() {
    throw new RuntimeException("Should never be called");
  }

  /* protected method defined only to check accessibilty */
  protected static void protectedMethod() {
    throw new RuntimeException("Should never be called");
  }

  /* private instance method defined only to check accessibilty */
  private void privateInstanceMethod() {
    throw new RuntimeException("Should never be called");
  }

  /* protected instance method defined only to check accessibilty */
  protected void protectedInstanceMethod() {
    throw new RuntimeException("Should never be called");
  }

  /* public instance method defined only to check accessibilty */
  public void publicInstanceMethod() {
    throw new RuntimeException("Should never be called");
  }

}
