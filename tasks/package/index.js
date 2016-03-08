if (typeof window === "undefined") {
    // Running in Node
    console.log("JavaPolyNodeSystem running in Node");

    var loadModule = function() {
        var paths = ['./javapoly-node-system-raw.js', './package/javapoly-node-system-raw.js', 'JavaPoly/javapoly-node-system-raw.js'];
        var result;
        var fs = require('fs');
        var errors = [];
        paths.forEach(function (path) {
            try {
                result = require(path);
            } catch (e) {
                errors.push(e);
            }
        });
        if (result) {
            return result;
        } else {
            errors.forEach(function (e) {
                console.error("Error requesting module on path: %s", path);
                console.error(e);
            })
        }
    };

    // Constructor
    const JavaPolyNodeSystem = loadModule();
    if (JavaPolyNodeSystem) {

        // For running this code as Node module
        module.exports = JavaPolyNodeSystem;
    } else {
        console.error("JavaPolyNodeSystem wasn't loaded");
    }
} else {
    // Running in browser
    console.log("JavaPolyBrowser running in browser");

    //
    const JavaPolyBrowser = require('./javapoly-browser.js');
}
