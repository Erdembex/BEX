package com.takkas.infrastructure.mail;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class SmtpMailService implements MailService {

    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${app.base-url}")
    private String baseUrl;

    @Value("${spring.mail.from:noreply@passla.com.tr}")
    private String fromAddress;

    public SmtpMailService(ObjectProvider<JavaMailSender> mailSenderProvider) {
        this.mailSenderProvider = mailSenderProvider;
    }

    @Override
    public boolean sendVerificationEmail(String to, String token) {
        String body = """
            Passla hesabını doğrulamak için kodun:

            %s

            Bu kod 24 saat geçerlidir. Uygulamada "E-posta Doğrulama" ekranına kodu girerek kaydını tamamlayabilirsin.

            Bu isteği sen yapmadıysan bu e-postayı yok say.
            """.formatted(token);
        boolean sent = deliver(to, "Passla — E-posta doğrulama kodu", body);
        log.info("[MailService] Doğrulama kodu: to={} token={} sent={}", to, token, sent);
        return sent;
    }

    @Override
    public boolean sendPasswordResetEmail(String to, String token) {
        String body = """
            BEX hesabın için şifre sıfırlama kodun:

            %s

            Bu kod 1 saat geçerlidir. Uygulamada "Şifre Sıfırla" ekranına kodu girerek yeni şifreni belirleyebilirsin.

            Bu isteği sen yapmadıysan bu e-postayı yok say.
            """.formatted(token);
        boolean sent = deliver(to, "BEX — Şifre sıfırlama kodu", body);
        log.info("[MailService] Şifre sıfırlama kodu: to={} token={} sent={}", to, token, sent);
        return sent;
    }

    @Override
    public void sendGenericEmail(String to, String subject, String body) {
        deliver(to, subject, body);
        log.info("[MailService] E-posta: to={} subject={}", to, subject);
    }

    private boolean deliver(String to, String subject, String body) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            log.info("[MailService] SMTP yapılandırılmadı — içerik loglandı: to={} subject={} body={}",
                to, subject, body);
            return false;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            if (fromAddress != null && !fromAddress.isBlank()) {
                message.setFrom(fromAddress);
            }
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            return true;
        } catch (Exception ex) {
            log.warn("[MailService] E-posta gönderilemedi ({}): {} — {}", to, ex.getMessage(), body);
            return false;
        }
    }
}
