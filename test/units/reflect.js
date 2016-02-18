function testReflect() {
  if (!isWorkerBased) {
    describe('Reflection', function() {
      it('should reflect js object into java', function() {
        return Java.type("EvalTest").then(function(EvalTest) {
          var stringTest = EvalTest.getProperty({name1: "xyz", name2: 10}, "name1").then(function(name1Val) {
            expect(name1Val).toBe("xyz");
          });
          var numberTest = EvalTest.getProperty({name1: "xyz", name2: 10}, "name2").then(function(name2Val) {
            expect(name2Val).toBe(10);
          });
          var deepObjTest = EvalTest.getProperty({name1: "xyz", name3: {inner:"pqr"}}, "name3").then(function(name3Val) {
            expect(name3Val.inner).toBe("pqr");
          });
          return Promise.all([stringTest, numberTest, deepObjTest]);
        });
      });

      it('should reflect js object from java', function() {
        return Java.type("com.javapoly.Eval").then(function(Eval) {
          return Eval.eval('({name1: "xyz", name2: 10, name3: {inner: "music"}})').then(function(result) {
            expect(result.name1).toBe("xyz");
            expect(result.name3.inner).toBe("music");
          });
        });
      });
    });
  }
}

