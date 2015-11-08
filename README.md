# JavaPoly

## Building

There is a Grunt script for building JavaPoly. So for building you have to install `grunt-cli`. Just type command:
```bash
$ npm install -g grunt-cli
```

After this install all needed packages and type:
```bash
$ npm install
```

For building JavaPoly run command:
```bash
$ grunt build
```

This creates `build/javapoly.js` file.

### Development JavaPoly

To develop JavaPoly you have to run command:
```bash
$ grunt watch
```

This command runs watching process that updates build-file when you change any js-file in src-folder.

### Testing JavaPoly

There is a folder `tests` which should have to contain simple build of Doppio and JavaPoly.

Make a build of Doppio and put it into folder `tests/doppio`.

Have in view that **watch**ing-process updates JavaPoly build in `tests` folder.

But you can rebuild JavaPoly for testing without watching by command:
```bash
$ grunt build:test
```

To test JavaPoly you should run HTTP server for folder `tests` and open `index.html` in browser.

Simplest way to do this is using light HTTP server `http-server`. To install this run command:
```bash
$ npm install -g http-server
```

And then locate to folder `tests` and run there command:
```bash
$ http-server
```

After this open browser and locate into the page http://localhost:8080/index.html