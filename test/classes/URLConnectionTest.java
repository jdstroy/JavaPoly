import java.io.*;
import java.net.*;

class URLConnectionTest {
  public static InputStream sendData(final String urlStr) {
    try {
      final URL url = new URL(urlStr);
      final HttpURLConnection connection = (HttpURLConnection) url.openConnection();
      connection.setRequestMethod("POST");

      connection.setDoOutput(true);

      final InputStream is = connection.getInputStream();

      final OutputStream os = connection.getOutputStream();

      for (int i = 0; i < 120; i++) {
        os.write(i);
      }

      os.close();

      return is;
    } catch (Exception e) {
      throw new RuntimeException(e);
    }
  }
}
