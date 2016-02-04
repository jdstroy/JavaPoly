function testDynamicAdd() {
  var isProxySupported = (typeof Proxy !== 'undefined');
  describe('dynamically addClass', function(){
    it('add jar', function(){
      return addClass('/jars/commons-codec-1.10.jar').then(function(addClassResult){
        return Java.type('org.apache.commons.codec.binary.StringUtils').then(function(StringUtils) {
          return StringUtils.equals('a','a').then(function (result){
            expect(result).toEqual(true);
          });
        });
      });
    });

    it('add class', function(){
      return addClass('/classes/Main2.class').then(function(addClassResult){
        return Java.type('Main2').then(function(Main) {
          return Main.test().then(function(result) {
            expect(result).toEqual('test message in Main2');
          });
        });
      });
    });

    it('add remote source code', function() {
      return addClass('/classes/Main3.java').then(function(addClassResult){
        return Java.type('com.javapoly.test.Main3').then(function(Main3) {
          return Main3.testIt().then(function(result) {
            expect(result).toEqual('Main3::testIt()');
          });
        });
      });
    });

    it('add embedded source code', function() {
      var mainJavaSource = 'package com.javapoly.test; \n' +
        'public class Main4 { \n' +
        'public static String testIt() { \n' +
        '  return "Main4:testIt()"; \n' +
        '} \n' +
      '}';
      return addClass(mainJavaSource).then(function(addClassResult){
        return Java.type('com.javapoly.test.Main4').then(function(Main4) {
          return Main4.testIt().then(function(result) {
            expect(result).toEqual('Main4:testIt()');
          });
        });
      });
    });

    if (isProxySupported) {
      describe('Proxy access of dynamically added Class', function(){

        it('proxy access of added jar, ', function(){
          return addClass('/jars/commons-codec-1.10.jar').then(function(addClassResult){
            return J.org.apache.commons.codec.binary.StringUtils.equals('a','a').then(function (result){
              expect(result).toEqual(true);
              });
          });
        });

        it('proxy access of added class', function(){
          return addClass('/classes/Main2.class').then(function(addClassResult){
            return J.Main2.test().then(function(result) {
              expect(result).toEqual('test message in Main2');
              });
            });
        });

        it('proxy access of added source code', function() {
          return addClass('/classes/Main3.java').then(function(addClassResult){
            return J.com.javapoly.test.Main3.testIt().then(function(result) {
              expect(result).toEqual('Main3::testIt()');
            });
          });
        });

        it('add embedded source code', function() {
          var mainJavaSource = 'package com.javapoly.test;\n' +
            'public class Main4 {\n' +
            'public static String testIt() {\n' +
              'return "Main4:testIt()";\n' +
            '}\n' +
          '}';
          return addClass(mainJavaSource).then(function(addClassResult){
            return J.com.javapoly.test.Main4.testIt().then(function(result) {
              expect(result).toEqual('Main4:testIt()');
            });
          });
        });
      });
    }

  });
}
