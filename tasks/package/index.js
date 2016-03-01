let JavaPoly;

if (typeof window !== "undefined") {
    // Running in browser
    console.log("JavaPolyBrowser running in browser");

    const JavaPolyBrowser = require('../../src/core/JavaPoly').default;

    JavaPoly = JavaPolyBrowser;
} else {
    // Running in Node
    console.log("JavaPolyNodeSystem running in Node");

    const JavaPolyNodeSystem = require('../../src/core/JavaPolyNodeSystem').default;

    JavaPoly = JavaPolyNodeSystem;
}

global.JavaPoly = new JavaPoly();

// For Node
module.exports = JavaPoly;

console.log(JavaPoly);
console.log(global.JavaPoly);