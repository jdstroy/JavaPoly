registerNatives({
  'com/javapoly/Eval': {

    'evalRaw(Ljava/lang/String;)[Ljava/lang/Object;': function(thread, toEval) {
      var expr = toEval.toString();
      var res = eval(expr);
      return util.newArrayFromData(thread, thread.getBsCl(), '[Ljava/lang/Object;', [util.initString(thread.getBsCl(), typeof res), res]);
    }
  }

});
