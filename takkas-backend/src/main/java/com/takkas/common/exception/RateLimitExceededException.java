package com.takkas.common.exception;

public class RateLimitExceededException extends TakkasException {
    public RateLimitExceededException(String message) {
        super(message);
    }
}
