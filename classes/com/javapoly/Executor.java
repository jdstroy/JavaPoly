package com.javapoly;

public class Executor {

    static native Object[] awaitForTask();
    
    static Object runMethod(Object[] meta) {
        return null;
    }
    
    static native void returnTaskResult(Object result);

    static native void notifyIsLoaded();

    public static void main(String args[]) {
        notifyIsLoaded();

        while(true) {
            Object[] meta = awaitForTask();
            Object result = runMethod(meta);
            returnTaskResult(result);
        }
    }
}
