public class Main {
  public static String test() {
    return "test message";
  }

  public static void main(String args[]) {
    System.out.println("hello world2");
  }

  public static String readFile(String fileName) {

    try(final java.io.FileReader fr = new java.io.FileReader(fileName)) {
      boolean done = false;
      final StringBuffer result = new StringBuffer();
      while (!done) {
        int c = fr.read();
        done = c == -1;
        if (!done) {
          result.append((char) c);
        }
      }

      return result.toString();
    } catch (java.io.IOException e) {
      System.out.println("Exception while reading from file");
      return null;
    }
  }

}
