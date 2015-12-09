// https://github.com/plasma-umass/doppio/blob/master/tasks/listings.ts
var fs = require('fs');
function generateListings(dir, ignore) {
    var symLinks = {};
    function rdSync(dpath, tree, name) {
        var files = fs.readdirSync(dpath), i, file, fpath;
        for (i = 0; i < files.length; i++) {
            file = files[i];
            if (ignore.indexOf(file) === -1) {
                fpath = dpath + "/" + file;
                try {
                    var lstat = fs.lstatSync(fpath);
                    if (lstat.isSymbolicLink()) {
                        var realdir = fs.readlinkSync(fpath);
                        // Ignore if we've seen it before.
                        if (symLinks[realdir]) {
                            continue;
                        }
                        else {
                            symLinks[realdir] = 1;
                        }
                    }
                    var fstat = fs.statSync(fpath);
                    if (fstat.isDirectory()) {
                        tree[file] = {};
                        rdSync(fpath, tree[file], file);
                    }
                    else {
                        tree[file] = null;
                    }
                }
                catch (e) {
                }
            }
        }
        return tree;
    }
    return rdSync(dir, {}, '/');
}
function listings(grunt) {
    grunt.registerMultiTask('listings', 'Generates listings.json', function () {
        var options = this.options(), cwd = options.cwd;
        fs.writeFileSync(options.output, JSON.stringify(generateListings(cwd, ['.git', 'node_modules'])));
    });
}
module.exports = listings;
