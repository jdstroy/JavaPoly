//import JavaPolyNodeDoppio from '../../src/core/JavaPolyNodeDoppio';
//import JavaPolyNodeSystem from '../../src/core/JavaPolyNodeSystem';

let JavaPoly;

if (typeof window !== "undefined") {
    console.log("running in browser");
    // Running in browser
    const JavaPolyBrowser = require('../../src/core/JavaPoly');
    JavaPoly = JavaPolyBrowser;
    console.log(JavaPolyBrowser);
    console.log(new JavaPoly());
} else {
    console.log("running in node");

    var child_process = require("child_process");
    console.log(child_process);
    // Running in Node
    /*
    * Should detect env for running JVM or Doppio
    * */
    const JavaPolyNodeDoppio = require('../../src/core/JavaPolyNodeDoppio').default;
    JavaPoly = JavaPolyNodeDoppio;
    console.log(JavaPolyNodeDoppio);
    console.log(new JavaPoly());
}

global.JavaPoly = JavaPoly;

// Maybe should do this?
module.exports = JavaPoly;