# JavaPoly

## Building

There is a Grunt script for building JavaPoly. So for building you have to install `grunt-cli`. Just type command:
```sh
$ npm install -g grunt-cli
```

After this install all needed packages and type:
```sh
$ npm install
```

For building JavaPoly run command:
```sh
$ grunt build
```

This creates `build/javapoly.js` file.

### Development JavaPoly

To develop JavaPoly you have to run command:
```sh
$ grunt watch
```

This command runs watching process that updates build-file when you change any js-file in src-folder.

### Testing JavaPoly

There is a folder `test` which should have to contain simple build of Doppio and JavaPoly.

Make a build of Doppio and put it into folder `test/doppio`.

Have in view that **watch**ing-process updates JavaPoly build in `test` folder.

But you can rebuild JavaPoly for testing without watching by command:
```sh
$ grunt build:test
```

To test JavaPoly you should run HTTP server for folder `test` and open `index.html` in browser.

Simplest way to do this is using light HTTP server `http-server`. To install this run command:
```sh
$ npm install -g http-server
```

And then locate to folder `test` and run there command:
```sh
$ http-server
```

After this open browser and locate into the page http://localhost:8080/index.html. You'll a page index.html that contains Mocha tests environment.

Also you can test JavaPoly via Mocha in nodejs. Install it by typing:
```sh
$ npm install -g mocha
```

And type `mocha` in projects directory.