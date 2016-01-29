function testProxy() {
  var isProxySupported = (typeof Proxy !== 'undefined');

  describe('Proxy access', function() {

    if (!isProxySupported) {

      it('checks that J is undefined if Proxy is not supported', function() {
        expect(typeof J === 'undefined').toBe(true);
      });

    } else {

      it('checks that J is defined', function() {
        expect(J).toExist();
      });

      describe('java.lang.Integer', function() {

        it('toHexString', function() {
          return J.java.lang.Integer.toHexString(42).then(function(result) {
            expect(result).toEqual('2a');
          });
        });

        it('reverse', function() {
          return J.java.lang.Integer.reverse(42).then(function(result) {
            expect(result).toEqual(1409286144);
          });
        });

        it('compare', function() {
          return J.java.lang.Integer.compare(42, 41).then(function(result) {
            expect(result).toEqual(1);
          });
        });

        it('parseInt', function() {
          return J.java.lang.Integer.parseInt('42').then(function(result) {
            expect(result).toEqual(42);
          });
        });

      });

      describe('java.lang.Double', function() {
        it('toHexString', function() {
          return J.java.lang.Double.toHexString(42).then(function(result) {
            expect(result).toEqual('0x1.5p5');
          });
        });
      });

      describe('classes/Main.class', function() {
        it('static test()', function() {
          return J.Main.test().then(function(result) {
            expect(result).toEqual('test message');
          });
        })
      });

      describe('jars/javapoly-utils.jar', function() {
        it('jar static test()', function() {
          return J.com.javapoly.utils.Test.test().then(function(result) {
            expect(result).toEqual('test message in jar');
          });
        })
      });

    }
  });

}
