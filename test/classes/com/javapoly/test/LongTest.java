package com.javapoly.test;

public class LongTest {
	public static long testPassingPos() {
		return 9007199254740991L;
	}
	public static long testFailingPos() {
		return 9007199254740992L;
	}
	public static long testPassingNeg() {
		return -9007199254740991L;
	}
	public static long testFailingNeg() {
		return -9007199254740992L;
	}
}