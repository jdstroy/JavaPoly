public class Counter {
  public final double wrapLimit = 27;

  public double currentValue = 0;

  public Counter() {
  }

  public void increment(final double delta) {
    currentValue += delta;
    currentValue %= wrapLimit;
  }

  public boolean isValid() {
    return currentValue < wrapLimit;
  }
}
