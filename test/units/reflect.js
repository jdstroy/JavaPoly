function testReflect() {
  if (!isWorkerBased) {
    describe('Reflection', function() {
      it('should reflect js object into java', function() {
        return JavaPoly.type("EvalTest").then(function(EvalTest) {
          var obj = {name1: "xyz", name2: 10};
          var objDeep = {name1: "xyz", name2: 10, name3: {inner: "pqr"}};
          var objFunction = {name1: "xyz", square: function(n) { return n * n}};
          var objArray = {name1: "xyz", primes: [2, 3, 5, 7, 11]};

          var stringTest = EvalTest.getProperty(obj, "name1").then(function(name1Val) {
            expect(name1Val).toBe("xyz");
          });
          var numberTest = EvalTest.getProperty(obj, "name2").then(function(name2Val) {
            expect(name2Val).toBe(10);
          });
          var deepObjTest = EvalTest.getProperty(objDeep, "name3").then(function(name3Val) {
            expect(name3Val.inner).toBe("pqr");
          });
          var functionObjTest = EvalTest.getProperty(objFunction, "square").then(function(square) {
            expect(square(5)).toBe(25);
          });
          var arrayObjTest = EvalTest.getProperty(objArray, "primes").then(function(primes) {
            expect(primes[0]).toBe(2);
            expect(primes[4]).toBe(11);
          });
          return Promise.all([stringTest, numberTest, deepObjTest, functionObjTest, arrayObjTest]);
        });
      });

      it('should reflect js object from java', function() {
        return JavaPoly.type("com.javapoly.Eval").then(function(Eval) {
          return Eval.eval('({name1: "xyz", name2: 10, name3: {inner: "music"}})').then(function(result) {
            expect(result.name1).toBe("xyz");
            expect(result.name3.inner).toBe("music");
          });
        });
      });
    });
  }
}

