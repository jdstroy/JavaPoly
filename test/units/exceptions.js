function testExceptions() {
  describe('Exception check', function() {

    it('should handle exceptions correctly', function() {
      return JavaPoly.type('Main').then(function(Main) {
        return new Promise(function(resolve, reject) {
          Main.exceptionThrower().then(function() {
            reject(new Error("not expecting the promise to resolve"));
          }, function(e) {
            expect(e.name).toBe("java.lang.RuntimeException");
            expect(e.message).toBe("Deliberate exception for testing");
            expect(e.causedBy).toNotExist();
            expect(e.printStackTrace).toExist();
            resolve();
          });
        });
      });
    });

    it('should handle exceptions with null messages correctly', function() {
      return JavaPoly.type('Main').then(function(Main) {
        return new Promise(function(resolve, reject) {
          Main.exceptionThrowerWithNullMessage().then(function() {
            reject(new Error("not expecting the promise to resolve"));
          }, function(e) {
            expect(e.name).toBe("java.lang.RuntimeException");
            expect(e.message).toBe(null);
            expect(e.causedBy).toNotExist();
            expect(e.printStackTrace).toExist();
            resolve();
          });
        });
      });
    });

    it('should handle arithmetic exceptions correctly', function() {
      return JavaPoly.type('Main').then(function(Main) {
        return new Promise(function(resolve, reject) {
          Main.exceptionThrower2(0).then(function(result) {
            reject(new Error("not expecting the promise to resolve"));
          }, function(e) {
            expect(e.name).toBe("java.lang.ArithmeticException");
            expect(e.message).toBe("/ by zero");
            expect(e.causedBy).toNotExist();
            expect(e.printStackTrace).toExist();
            resolve();
          });
        });
      });
    });

  });
}
