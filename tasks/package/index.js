let JavaPoly;

if (typeof window !== "undefined") {
    // Running in browser
    console.log("JavaPolyBrowser running in browser");

    const JavaPolyBrowser = require('../../src/core/JavaPoly').default;
    // JavaPoly for browser create object already
    // JavaPolyBrowser = new JavaPoly({/* with options */});

    JavaPoly = JavaPolyBrowser;
} else {
    // Running in Node
    console.log("JavaPolyNodeSystem running in Node");

    const JavaPolyNodeSystem = require('../../src/core/JavaPolyNodeSystem').default;
    // It returns only object with default method
    // default is constructor

    JavaPoly = JavaPolyNodeSystem;
}

global.JavaPoly = new JavaPoly();

// For Node
module.exports = JavaPoly;

console.log(JavaPoly);