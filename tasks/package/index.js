import JavaPolyBrowser from '../../src/core/JavaPoly';
import JavaPolyNodeDoppio from '../../src/core/JavaPolyNodeDoppio';
import JavaPolyNodeSystem from '../../src/core/JavaPolyNodeSystem';

let JavaPoly;

if (typeof window !== "undefined") {
    // Running in browser
    JavaPoly = JavaPolyBrowser;
} else {
    // Running in Node
    /*
    * Should detect env for running JVM or Doppio
    * */
    JavaPoly = JavaPolyNodeDoppio;
}

global.JavaPoly = JavaPoly;

// Maybe should do this?
module.exports = JavaPoly;