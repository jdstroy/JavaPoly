registerNatives({
  'com/javapoly/runtime/Utilities': {

    'eval(Ljava/lang/String;)Ljava/lang/Object;': function(thread, expr) {
      // Note: the conversion to from jvm string to JS string is not required in some cases.
      var exprJS = expr.jvm2js_str();
      return window.eval(exprJS);
    }
  }

});
