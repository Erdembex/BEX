package com.takkas.common.logging;

/**
 * Kişisel veriyi loglarken maskeler. Loglar operasyon ekibi ve journald
 * üzerinden erişilebilir olduğu için e-posta/telefon açık yazılmaz.
 */
public final class LogMask {

    private LogMask() {
    }

    public static String email(String email) {
        if (email == null || email.isBlank()) {
            return "<yok>";
        }
        int at = email.indexOf('@');
        if (at <= 0) {
            return "***";
        }
        return email.charAt(0) + "***" + email.substring(at);
    }

    public static String phone(String phone) {
        if (phone == null || phone.isBlank()) {
            return "<yok>";
        }
        String digits = phone.replaceAll("\\D", "");
        if (digits.length() <= 4) {
            return "***";
        }
        return "***" + digits.substring(digits.length() - 4);
    }
}
