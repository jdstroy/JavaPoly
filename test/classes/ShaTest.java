import java.io.UnsupportedEncodingException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public class ShaTest {

  public static byte sha256(String input) throws NoSuchAlgorithmException{
    MessageDigest md = MessageDigest.getInstance("SHA-256");
    md.update(input.getBytes());
    byte[] digest = md.digest();
    return digest[0];
  }
}
