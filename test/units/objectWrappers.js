function testObjectWrappers() {
  if (!isWorkerBased) {
    // Object wrappers are not supported in web-worker mode

    describe('Object wrappers', function() {

      it('should wrap fields', function() {
        return Java.new('Counter').then(function(counter) {
          var t1 = counter.increment(42).then(function() {
            return counter.currentValue.then(function(cValue) {
              expect(cValue).toEqual(15);
            });
          });
          return t1.then(function() {
            counter.currentValue = 42;
            return counter.isValid().then(function(itIsValid) {
              expect(itIsValid).toBe(false);
            });
          });
        });
      });

      it('should automatically unwrap when passed as parameter', function() {
        return Java.new("java.io.File", "/abc").then(function(abcFile) {
          return Java.new("java.io.File", "/xyz").then(function(xyzFile) {
            return abcFile.compareTo(xyzFile).then(function(comparison) {
              expect(comparison).toBeLessThan(0);
            });
          });
        });
      });

      it('should return positive 64 bit integers that JS can handle', function() {
        return Java.type("com.javapoly.test.LongTest").then(function(myclass) {
          return myclass.testPassingPos().then(function(result) {
            expect(result).toEqual(9007199254740991);
          });
        });
      });

      it('should not return positive 64 bit integers too big for JS', function() {
        return new Promise(function(resolve, reject) {
          return Java.type("com.javapoly.test.LongTest").then(function(myclass) {
            return myclass.testFailingPos().then(function() {
              reject(new Error('Not expecting promise to resolve'));
            },
            function(e) {
              expect(e.name).toBe("RangeError");
              expect(e.message).toBe("Unfortunately, JavaScript does not yet support 64 bit integers");
              expect(e.causedBy).toNotExist();
              expect(e.printStackTrace).toExist();
              resolve();
            });
          });
        });
      });

      it('should return negative 64 bit integers that JS can handle', function() {
        return Java.type("com.javapoly.test.LongTest").then(function(myclass) {
          return myclass.testPassingNeg().then(function(result) {
            expect(result).toEqual(-9007199254740991);
          });
        });
      });

      it('should not return negative 64 bit integers too big for JS', function() {
        return new Promise(function(resolve, reject) {
          return Java.type("com.javapoly.test.LongTest").then(function(myclass) {
            return myclass.testFailingNeg().then(function() {
              reject(new Error("not expecting the promise to resolve"));
            },
            function(e) {
              expect(e.name).toBe("RangeError");
              expect(e.message).toBe("Unfortunately, JavaScript does not yet support 64 bit integers");
              expect(e.causedBy).toNotExist();
              expect(e.printStackTrace).toExist();
              resolve();
            });
          });
        });
      });

      it('should be used for new objects defined with convenience function', function() {
        return Java.new('java.io.File', "/sys/someunlikelyfilenamethatwontexist").then(function(file) {
          return file.exists().then(function(itExists) {
            expect(itExists).toBe(false);
          });
        });
      });

      it('should be used for new objects', function() {
        return Java.type('java.io.File').then(function(File) {
          return new File("/sys/someunlikelyfilenamethatwontexist").then(function(file) {
            return file.exists().then(function(itExists) {
              expect(itExists).toBe(false);
            });
          });
        });
      });

      describe('should wrap Properties object', function() {
        it('get property', function() {
          return Java.type('java.lang.System').then(function(System) {
            return System.getProperties().then(function(properties) {

              function checkProperty(key, expectedValue) {
                return properties.getProperty(key).then(function(value) {
                  expect(value).toEqual(expectedValue);
                });
              }

              return Promise.all([
                checkProperty("os.arch", "js"),
                checkProperty("user.name", "DoppioUser"),
                checkProperty("java.io.tmpdir", "/tmp"),
                checkProperty("java.vm.vendor", "PLASMA@UMass"),
                checkProperty("java.vm.name", "DoppioJVM 32-bit VM"),
              ]);
            });
          });
        });
      });

    });

  }

}
