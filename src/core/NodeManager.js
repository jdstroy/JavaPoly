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

let tempAlreadyDeleted = false;

let deletingTempDirectory = function () {
    if (tempAlreadyDeleted) {
        return;
    }
    try {
        let path = require('path');
        let fs = require('fs');
        let deleteFolderRecursive = function (pathTo) {
            if (fs.existsSync(pathTo)) {
                fs.readdirSync(pathTo).forEach(function (file, index) {
                    var curPath = pathTo + "/" + file;
                    if (fs.lstatSync(curPath).isDirectory()) { // recurse
                        deleteFolderRecursive(curPath);
                    } else { // delete file
                        fs.unlinkSync(curPath);
                    }
                });
                fs.rmdirSync(pathTo);
            }
        };
        deleteFolderRecursive(tempDirectory);
        console.log('Temp directory', tempDirectory, 'successfully deleted.');
    } catch (error) {
        console.error('Error on while deleting temp directory.');
        console.error(error);
    }
    tempAlreadyDeleted = true;
};

process.on('exit', () => {
    console.log('exit');
    deletingTempDirectory();
});

process.on('SIGINT', () => {
    console.log('SIGINT');
    deletingTempDirectory();
    process.exit(2);
});

process.on('uncaughtException', (error) => {
    console.error('uncaughtException');
    console.error(error);
    deletingTempDirectory();
});

export default class NodeManager {
    static getTempDirectory() {
        return tempDirectory;
    }
}