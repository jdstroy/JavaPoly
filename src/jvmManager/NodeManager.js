/**
 * Created by titan on 12.05.16.
 */
"use strict";
let tempDirectory = (function () {
    let path = require('path');
    let os = require('os');
    let directoryPath = path.join(os.tmpdir(), 'javapoly-' + process.pid.toString());
    let fs = require('fs');
    fs.mkdirSync(directoryPath);
    console.log('Temp directory', directoryPath, 'was created.');
    return directoryPath;
})();

process.on('exit', (code) => {
    try {
        let fs = require('fs');
        let deleteFolderRecursive = function (path) {
            if (fs.existsSync(path)) {
                fs.readdirSync(path).forEach(function (file, index) {
                    var curPath = path + "/" + file;
                    if (fs.lstatSync(curPath).isDirectory()) { // recurse
                        deleteFolderRecursive(curPath);
                    } else { // delete file
                        fs.unlinkSync(curPath);
                    }
                });
                fs.rmdirSync(path);
            }
        };
        console.log('Temp directory', tempDirectory, 'successfully deleted.');
    } catch (error) {
        console.error('Error on while deleting temp directory.');
        console.error(error);
        code = 113;
    }
});

export default class NodeManager {
    static getTempDirectory() {
        return tempDirectory;
    }
}