class Threads {
  private static Thread busyThread = null;
  private static Thread sleepyThread = null;

  private static int busyResult = 0;
  private static int sleepyResult = 0;

  public static void startBusyThread() {
   busyThread = new Thread(() -> {
     for (int i = 1; i < 20; i++) {
       if (isPrime(fib(i))) {
         busyResult += fib(i*2);
       }
     }
     System.out.println("busy result: " + busyResult);
   });
   busyThread.start();
  }

  public static void startSleepyThread() {
   sleepyThread = new Thread(() -> {
     try {
       for (int i = 2; i < 12; i++) {
         Thread.sleep(500);
         if (isPrime(fib(i))) {
           sleepyResult += i;
         }
       }
       System.out.println("sleepyResult: " + sleepyResult);
     } catch (InterruptedException ie) {
       ie.printStackTrace();
     }
   });
   sleepyThread.start();
  }

  private static boolean isPrime(long n) {
    if (n <= 3) return true;
    if (n % 2 == 0) return false;
    final long upperBound = (int) Math.sqrt(n);
    for (long i = 3; i < upperBound; i += 2) {
      if (n % i == 0) {
        return false;
      }
    }
    return true;
  }

  private static int fib(int n) {
    return (n < 2) ? n : fib(n-1) + fib(n-2);
  }

  public static int testIt() {
    try {
      sleepyThread.join();
      busyThread.join();
    } catch (InterruptedException ie) {
      ie.printStackTrace();
    }

    return sleepyResult + busyResult;
  }

  public static void main(String[] args) {
    startSleepyThread();
    startBusyThread();
  }
}
