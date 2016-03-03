let JavaPoly;

if (typeof window !== "undefined") {
    // Running in browser
    console.log("JavaPolyBrowser running in browser");

    // Constructor
    const JavaPolyBrowser = require('../../src/core/JavaPoly').default;

    JavaPoly = JavaPolyBrowser;
} else {
    // Running in Node
    console.log("JavaPolyNodeSystem running in Node");

    // Constructor
    const JavaPolyNodeSystem = require('./javapoly-node-system.js');
    console.log(JavaPolyNodeSystem);

    JavaPoly = JavaPolyNodeSystem;
}

global.JavaPoly = new JavaPoly();

// For creating this code as Node module
module.exports = JavaPoly;
