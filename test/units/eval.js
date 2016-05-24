function testEval() {
  describe('Eval', function() {

    it('should pass all tests from EvalTest.java', function() {
      return JavaPoly.type('EvalTest').then(function(EvalTest) {
        return EvalTest.test().then(function(result) {
          expect(result).toEqual(true);
        }, (error) => console.log(error));
      });
    });

  });
}

/* Disabling for now. We can re-enable after using the newer version of eval.

describe('Utilities', function() {

  describe('eval', function() {
    it('integer arithmetic', function() {
      return JavaPoly.type('com.javapoly.runtime.Utilities').then(function(Utilities) {
        Utilities.eval("40 + 2").then(function(result) {
          expect(result).toEqual(42);
        });
      });
    });

    it('string split', function() {
      return JavaPoly.type('com.javapoly.runtime.Utilities').then(function(Utilities) {
        Utilities.eval("'a,b,c'.split(',')").then(function(result) {
          expect(result).toEqual(["a", "b", "c"]);
        });
      });
    });

    it('function definition', function() {
      return JavaPoly.type('com.javapoly.runtime.Utilities').then(function(Utilities) {
        Utilities.eval("(function(x){return x*x})").then(function(result) {
          expect(result(7)).toEqual(49);
        });
      });
    });

  });

});
*/

