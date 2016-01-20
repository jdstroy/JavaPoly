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

/* This function is used to wrap and return an object and its type to Java land.
 * It returns an array of Object[], where the first element is a string describing the JS type,
 * and the second is the obj.
 */
function getRawType(thread, obj) {
  return util.newArrayFromData(thread, thread.getBsCl(), '[Ljava/lang/Object;', [util.initString(thread.getBsCl(), typeof obj), obj])
}

registerNatives({
  'com/javapoly/Eval': {

    'evalRaw(Ljava/lang/String;)[Ljava/lang/Object;': function(thread, toEval) {
      var expr = toEval.toString();
      var res = eval(expr);
      return util.newArrayFromData(thread, thread.getBsCl(), '[Ljava/lang/Object;', [util.initString(thread.getBsCl(), typeof res), res]);
    },

    'getRawType(Ljava/lang/Object;)[Ljava/lang/Object;': function(thread, obj) {
      return getRawType(thread, obj);
    },

    'getProperty(Ljava/lang/Object;Ljava/lang/String;)[Ljava/lang/Object;': function(thread, obj, name) {
      var nameStr = name.toString();
      return getRawType(thread, obj[nameStr]);
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
      return getRawType(thread, res);
    },

    'asDouble(Ljava/lang/Object;)D': function(thread, arg0) {
      return arg0;
    },

    'asInteger(Ljava/lang/Object;)I': function(thread, arg0) {
      return arg0;
    },

    // TODO: This causes an exception from doppio: http://git.javadeploy.net/hrjet9/doppio-js-mirror/issues/1
    'asLong(Ljava/lang/Object;)J': function(thread, arg0) {
      return Doppio.VM.Long.fromNumber(arg0);
    },

    'asString(Ljava/lang/Object;)Ljava/lang/String;': function(thread, arg0) {
      return util.initString(thread.getBsCl(), arg0);
    }

  }
});
