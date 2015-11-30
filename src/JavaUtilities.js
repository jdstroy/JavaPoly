import JavaClassWrapper from './JavaClassWrapper';

class JavaUtilities {

  static runMethod(className, methodName, params) {
    return new Promise(
      (resolve, reject) => {
        JavaClassWrapper.getClassWrapperByName('com.javapoly.runtime.Utilities').then(Utilities => {
          Utilities.invokeClassMethod(className, methodName).then(returnValue => {
            resolve(returnValue);
          });
        });
      }
    );
  }
}

export default JavaUtilities;