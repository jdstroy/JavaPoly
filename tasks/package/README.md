```javascript
var JavaPoly = require('javapoly');
JavaPoly.addClass('/path/to/MyClass.java');
JavaPoly.addClass('/path/to/MyClass2.class');
JavaPoly.type('MyClass').then(function(MyClass){MyClass.doSomething();});
JavaPoly.type('MyClass2').then(function(MyClass2){MyClass2.doSomething();});
```

JavaPoly will work in nodejs and/or in the web browser, even if the user doesn't have Java installed!

For more details: https://www.javapoly.com