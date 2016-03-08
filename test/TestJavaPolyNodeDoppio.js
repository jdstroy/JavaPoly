// `npm install source-map-support` and uncomment to get mapped sources in stack traces
// require('source-map-support').install();

const NodeFS = require("fs");

const path = require('path');

global.expect = require("expect/umd/expect.min.js");

function initJavaPoly() {
  require('../build/javapoly-node-doppio.js');

  global.isWorkerBased = false;

  const doppioBase = path.resolve("node_modules/@hrj/doppiojvm-snapshot/dist/release-cli/")
  const javapolyBase = path.resolve("build/");

  global.Doppio = require(doppioBase + "/src/doppiojvm.js");
  const jp = new JavaPoly({doppioBase: doppioBase, javapolyBase: javapolyBase});
}

function runScript(fileName) {
  const vm = require('vm')

  const content = NodeFS.readFileSync(path.resolve(fileName));
  vm.runInThisContext(content, {filename: fileName})
}

initJavaPoly();

describe('javapoly test', function() {


  this.timeout(100000); // Let jvm to start and do not interrupt promises

  /*
   Currently doesn't work because XMLHttpRequest is not available in node!
  runScript("test/units/urls.js");
  testUrls();
  */

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

  describe('Object wrapper Tests', function() {
    before(() => {
      const counterAdd = addClass(path.resolve('test/classes/Counter.class'));
      const longAdd = addClass(path.resolve('test/classes/com/javapoly/test/LongTest.class'));
      return Promise.all([counterAdd, longAdd]);
    });

    runScript("test/units/objectWrappers.js");
    testObjectWrappers();
  });

  describe('Reflection Tests', function() {
    before(() => {
      return addClass(path.resolve('test/classes/EvalTest.class'));
    });

    runScript("test/units/reflect.js");
    testReflect();

  });

  describe('Eval Tests', function() {
    before(() => {
      return addClass(path.resolve('test/classes/EvalTest.class'));
    });

    runScript("test/units/eval.js");
    testEval();

  });

  describe('Exception Tests', function() {
    before(() => {
      return addClass(path.resolve('test/classes/Main.class'));
    });

    runScript("test/units/exceptions.js");
    testExceptions();

  });

});
