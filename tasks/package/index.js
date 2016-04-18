if (typeof window === "undefined") {
    // Running in Node
    console.log("JavaPolyNodeSystem running in Node");

    var loadModule = function() {
        var path = require('path');
        var currentDir = __dirname;
        var javaPolyPath = path.join(currentDir, 'javapoly-node-system-raw.js');
        var result;
        try {
            result = require(javaPolyPath);
        } catch (e) {
            console.error('Cannot load module on path: %s', javaPolyPath);
        }
        return result;
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
    module.exports = require('./javapoly-browser.js');
}
