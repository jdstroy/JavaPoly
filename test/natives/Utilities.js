registerNatives({
  'com/javapoly/runtime/Utilities': {

    'evalNative(Ljava/lang/String;)Ljava/lang/Object;': function(thread, expr) {
      // Note: the conversion to from jvm string to JS string is not required in some cases.
      var exprJS = expr.toString();
      var res = window.eval(exprJS);
      return util.newArrayFromData(thread, thread.getBsCl(), '[Ljava/lang/Object;', [res]);
    }
  }

});
