package com.takkas.infrastructure.mail;

public interface MailService {
    /** @return true if message was handed off to SMTP */
    boolean sendVerificationEmail(String to, String token);
    /** @return true if message was handed off to SMTP */
    boolean sendPasswordResetEmail(String to, String token);
    void sendGenericEmail(String to, String subject, String body);
}
