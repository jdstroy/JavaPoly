// const activeHandles = require('active-handles');

const path = require('path');

function initJavaPoly() {
  require('../build/javapoly-node-system.js');

  global.isWorkerBased = false;

  const javapolyBase = path.resolve("build/");

  const jp = new JavaPoly({javapolyBase: javapolyBase});
}

initJavaPoly();

addClass(path.resolve('test/classes/Main3.java')).then(function(addClassResult){
  return JavaPoly.type('com.javapoly.test.Main3').then(function(Main3) {
    return Main3.testIt().then(function (result){
      console.log("pass: " + (result === "Main3::testIt()23541499653099"));
      // setTimeout(() => {activeHandles.print();}, 2000);
    });
  });
 return 0;
});

addClass(path.resolve('test/classes/Threads.class')).then(function(addClassResult){
  console.log("Threads added");
  return JavaPoly.type('Threads').then(function(Threads) {
    return Threads.startSleepyThread().then(function () {
      return Threads.startBusyThread().then(function () {
        return Threads.testIt().then(function (result){
          console.log("Result: " + result);
          console.log("pass: " + (result === 5842488));
        });
      });
    });
  });
 return 0;
});

/*
setTimeout(() => {
  throw new Error("Check error handling");
}, 2000);
*/

// setTimeout(() => {console.log("Dummy timeout")}, 10000);
