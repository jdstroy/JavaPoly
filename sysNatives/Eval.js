util.toPrimitiveTypeName = function(name) {
  // TODO: Consider using a map
  switch(name) {
    case 'Ljava/lang/Integer;':   return "I";
    case 'Ljava/lang/Double;':    return "D";
    case 'Ljava/lang/Byte;':      return "B";
    case 'Ljava/lang/Character;': return "C";
    case 'Ljava/lang/Float;':     return "F";
    case 'Ljava/lang/Long;':      return "J";
    case 'Ljava/lang/Short;':     return "S";
    case 'Ljava/lang/Boolean;':   return "Z";
    case 'Ljava/lang/Void;':      return "V";
    default: return name;
  }
};

registerNatives({
  'javapoly/Eval': {

    'evalRaw(Ljava/lang/String;)[Ljava/lang/Object;': function(thread, toEval) {
      console.log("Eval raw", toEval.toString());
      var expr = toEval.toString();
      var res = eval(expr);
      return util.newArrayFromData(thread, thread.getBsCl(), '[Ljava/lang/Object;', [util.initString(thread.getBsCl(), typeof res), res]);
    },

    'invoke(Ljava/lang/Object;[Ljava/lang/Object;)[Ljava/lang/Object;': function(thread, toInvoke, args) {
      var ubArgs = args.array.map( (e) => {
        if (typeof e == "object" && typeof e['getClass'] == "function") {
          var intName = e.getClass().getInternalName();
          if (util.is_primitive_type(util.toPrimitiveTypeName(intName))) {
            return e.unbox();
          } else if (intName == 'Ljava/lang/String;') {
            return e.toString();
          } else {
            return e;
          }
        } else {
          return e;
        }
      });
      var res = toInvoke.apply(null, ubArgs);
      return util.newArrayFromData(thread, thread.getBsCl(), '[Ljava/lang/Object;', [util.initString(thread.getBsCl(), typeof res), res]);
    },

    'asDouble(Ljava/lang/Object;)D': function(thread, arg0) {
      return arg0;
    },

    'asInteger(Ljava/lang/Object;)I': function(thread, arg0) {
      return arg0;
    },

    // TODO: This causes an exception from doppio: http://git.javadeploy.net/hrjet9/doppio-js-mirror/issues/1
    'asLong(Ljava/lang/Object;)J': function(thread, arg0) {
      return arg0;
    },

    'asString(Ljava/lang/Object;)Ljava/lang/String;': function(thread, arg0) {
      return util.initString(thread.getBsCl(), arg0);
    }

  }
});
