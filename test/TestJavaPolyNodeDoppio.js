// `npm install source-map-support` and uncomment to get mapped sources in stack traces
// require('source-map-support').install();

// Not sure how to require these in src/*.js; browserify doesn't find them.
// Hence adding them here to global scope
const NodeFS = require("fs");
// global.NodeProcess = require("process");

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

  it('add jar', function(){
    return addClass(path.resolve('test/jars/commons-codec-1.10.jar')).then(function(addClassResult){
      return Java.type('org.apache.commons.codec.binary.StringUtils').then(function(StringUtils) {
        return StringUtils.equals('a','a').then(function (result){
          expect(result).toEqual(true);
        });
      });
    });
  });

  runScript("test/units/proxy.js");
  testProxy();

  describe('Object wrapper Tests', function() {
    before(() => {
      return addClass(path.resolve('test/classes/Counter.class'));
    });

    runScript("test/units/objectWrappers.js");
    testObjectWrappers();
  });

  describe('Eval Tests', function() {
    before(() => {
      return addClass(path.resolve('test/classes/EvalTest.class'));
    });

    runScript("test/units/eval.js");
    testEval();

  });

});
