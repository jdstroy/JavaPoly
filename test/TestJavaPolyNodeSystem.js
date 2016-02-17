// `npm install source-map-support` and uncomment to get mapped sources in stack traces
// require('source-map-support').install();

const NodeFS = require("fs");

const path = require('path');

global.expect = require("expect/umd/expect.min.js");

function initJavaPoly() {
  require('../build/javapoly-node-system.js');
  // require('../src/node-system.js');

  global.isWorkerBased = false;

  const javapolyBase = path.resolve("build/");

  const jp = new JavaPoly({javapolyBase: javapolyBase});
}

function runScript(fileName) {
  const vm = require('vm')

  const content = NodeFS.readFileSync(path.resolve(fileName));
  vm.runInThisContext(content, {filename: fileName})
}

initJavaPoly();

describe('javapoly test', function() {


  this.timeout(100000); // Let jvm to start and do not interrupt promises

  it('add jar', function(){
    return addClass(path.resolve('test/jars/commons-codec-1.10.jar')).then(function(addClassResult){
      return Java.type('org.apache.commons.codec.binary.StringUtils').then(function(StringUtils) {
        return StringUtils.equals('a','a').then(function (result){
          expect(result).toEqual(true);
        });
      });
    });
  });

  it('compile java source', function(){
    return addClass(path.resolve('test/classes/Main3.java')).then(function(addClassResult){
      return Java.type('com.javapoly.test.Main3').then(function(Main3) {
        return Main3.testIt().then(function (result){
          expect(result).toEqual("Main3::testIt()");
        });
      });
    });
  });

  runScript("test/units/proxy.js");
  testProxy();

  it('should handle exceptions correctly', function() {
    return addClass(path.resolve('test/classes/Main.class')).then(function(addClassResult){
      return Java.type('Main').then(function(Main) {
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
    }, function(error) {
      console.log(error.printStackTrace());
    });
  });

  describe('Exception Tests', function() {
    before(() => {
      return addClass(path.resolve('test/classes/Main.class'));
    });

    runScript("test/units/exceptions.js");
    testExceptions();

  });

  /*
  describe('Eval Tests', function() {
    before(() => {
      return addClass(path.resolve('test/classes/EvalTest.class'));
    });

    runScript("test/units/eval.js");
    testEval();

  });
  */

});
