function testStringIdAccess() {
  describe('String identifiers access', function() {

    it('checks that Java is defined', function() {
      expect(JavaPoly).toExist();
      expect(JavaPoly.type).toExist();
    });

    if (!isWorkerBased) {
      // Doppio not available when using web worker
      it('doppio should not be a release build', function() {
        JavaPoly.type('java.lang.Integer').then(function() {
          expect(Doppio.VM.JVM.isReleaseBuild()).toBe(false);
        });
      });
    }

    describe('JavaPoly.type', function() {

      it('should load class', function() {
        return JavaPoly.type('java.lang.Integer').then(function(Integer) {
          expect(Integer).toExist();
        });
      });

      describe('java.lang.Integer', function() {
        it('instance method should not exist in class wrapper: byteValue', function() {
          return JavaPoly.type('java.lang.Integer').then(function(Integer) {
            expect(Integer.byteValue).toNotExist();
          });
        });

        it('toHexString', function() {
          return JavaPoly.type('java.lang.Integer').then(function(Integer) {
            return Integer.toHexString(42).then(function(result) {
              expect(result).toEqual('2a');
            });
          });
        });

        it('toString', function() {
          return JavaPoly.type('java.lang.Integer').then(function(Integer) {
            return Integer.toString(42, 16).then(function(result) {
              expect(result).toEqual('2a');
            });
          });
        });

        it('parseInt', function() {
          return JavaPoly.type('java.lang.Integer').then(function(Integer) {
            return Integer.parseInt('42').then(function(result) {
              expect(result).toEqual(42);
            });
          });
        });
      });

    });

    describe('Math', function() {
      it('addExact() should add', function() {
        return JavaPoly.type('java.lang.Math').then(function(Math) {
          return Math.addExact(3, 7).then(function(result) {
            expect(result).toEqual(10);
          });
        });
      });

      it('random() should return a value', function() {
        return JavaPoly.type('java.lang.Math').then(function(Math) {
          return Math.random().then(function(result) {
            expect(result)
              .toExist()
              .toBeLessThan(1.0)
              .toBeGreaterThanOrEqual(0);
          });
        });
      })

      it('final fields should be accessible', function() {
        return JavaPoly.type('java.lang.Math').then(function(JMath) {
          return JMath.PI.then(function(result) {
            expect(result)
              .toBeLessThan(4.0)
              .toBeGreaterThanOrEqual(3.14);
          });
        });
      })
    });

    describe('System', function() {
      it('currentTimeMillis() should return a timestamp', function() {
        return JavaPoly.type('java.lang.System').then(function(System) {
          return System.currentTimeMillis().then(function(result) {
            expect(result)
              .toExist()
              .toBeGreaterThanOrEqual(0);
          });
        });
      });
    });

    describe('classes/Main.class', function() {
      it('instance and private methods should not exist in class wrapper', function() {
        return JavaPoly.type('Main').then(function(Main) {
          expect(Main.publicInstanceMethod).toNotExist();
          expect(Main.privateMethod).toNotExist();
          expect(Main.protectedMethod).toNotExist();
          expect(Main.privateInstanceMethod).toNotExist();
          expect(Main.protectedInstanceMethod).toNotExist();
        });
      });

      it('static test()', function() {
        return JavaPoly.type('Main').then(function(Main) {
          return Main.test().then(function(result) {
            expect(result).toEqual('test message');
          });
        });
      });

      it('function that flips a boolean value', function() {
        return JavaPoly.type('Main').then(function(Main) {
          var trueCheck = Main.flip(true).then(function(result) {
            expect(result).toEqual(false);
          });
          var falseCheck = Main.flip(false).then(function(result) {
            expect(result).toEqual(true);
          });
          return Promise.all([trueCheck, falseCheck]);
        });
      });

      it('function that returns a true value', function() {
        return JavaPoly.type('Main').then(function(Main) {
          return Main.checkLength("xyz", 3).then(function(result) {
            expect(result).toEqual(true);
          });
        });
      });

      it('function that returns a false value', function() {
        return JavaPoly.type('Main').then(function(Main) {
          return Main.checkLength("xyz", 8).then(function(result) {
            expect(result).toEqual(false);
          });
        });
      });

    });
    describe('method signature matching logic', function() {
      if (!isWorkerBased) {
        it('should print string', function() {
          return JavaPoly.type('java.lang.System').then(function(System) {
            return System.out.then(function(out) {
              out.println("hello javapoly");
            });
          });
        });
      }
      
      it('should call char static method', function() {
        return JavaPoly.type('Overload').then(function(Overload) {
          return Overload.staticMethod('a').then(function(result) {
            expect(result).toEqual('char:a');
          });
        });
      });

      it('should call byte static method', function() {
        return JavaPoly.type('Overload').then(function(Overload) {
          return Overload.staticMethod(42).then(function(result) {
            expect(result).toEqual('byte:42');
          });
        });
      });

      it('should call Float static method', function() {
        return JavaPoly.type('Overload').then(function(Overload) {
          return Overload.staticMethod(42.5).then(function(result) {
            expect(result).toEqual('Float:42.5');
          });
        });
      });
      if (!isWorkerBased) {
        it('should call String method', function() {
          return JavaPoly.new('Overload').then(function(obj) {
            return obj.method('a').then(function(result) {
              expect(result).toEqual('String:a');
            });
          });
        });

        it('should call Short method', function() {
          return JavaPoly.new('Overload').then(function(obj) {
            return obj.method(142).then(function(result) {
              expect(result).toEqual('Short:142');
            });
          });
        });

        it('should call Character constructor', function() {
          return JavaPoly.new('Overload', 'a').then(function(obj) {
            return obj.getText().then(function(result) {
              expect(result).toEqual('Character:a');
            });
          });
        });

        it('should call long constructor', function() {
          return JavaPoly.new('Overload', 100000000000001).then(function(obj) {
            return obj.getText().then(function(result) {
              expect(result).toEqual('long:100000000000001');
            });
          });
        });

        it('should call Float constructor', function() {
          return JavaPoly.new('Overload', 1.5).then(function(obj) {
            return obj.getText().then(function(result) {
              expect(result).toEqual('Float:1.5');
            });
          });
        });
      }
    });
  });
}
