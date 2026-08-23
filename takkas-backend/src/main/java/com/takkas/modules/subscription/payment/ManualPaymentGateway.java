package com.takkas.modules.subscription.payment;

import com.takkas.modules.subscription.domain.BusinessSubscription;
import com.takkas.modules.subscription.domain.SubscriptionPlan;
import com.takkas.modules.subscription.domain.enums.BillingPeriod;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;

/**
 * Sanal POS bağlanana kadar aktif olan geçici ödeme sağlayıcısı.
 * Checkout başlatıldığında dış bir ödeme sayfasına yönlendirme YAPMAZ; talebi
 * {@link BusinessSubscription} üzerinde "pending" olarak işaretler ve admin onayı bekler.
 * Admin, yönetim panelinden ödemeyi (banka havalesi, elden vs.) manuel doğruladıktan sonra
 * planı aktive eder ({@code SubscriptionService.confirmPendingUpgrade}).
 */
@Service
@Primary
@ConditionalOnProperty(name = "app.payment.provider", havingValue = "manual", matchIfMissing = true)
@Slf4j
public class ManualPaymentGateway implements PaymentGateway {

    private static final SecureRandom RANDOM = new SecureRandom();

    @Override
    public String getProviderName() {
        return "MANUAL";
    }

    @Override
    public CheckoutResult startCheckout(BusinessSubscription subscription, SubscriptionPlan targetPlan, BillingPeriod period) {
        String reference = generateReference();
        subscription.requestUpgrade(targetPlan, period, reference);
        log.info("[ManualPaymentGateway] Yükseltme talebi alındı: business={} plan={} period={} ref={}",
            subscription.getBusinessId(), targetPlan.getName(), period, reference);

        String message = "Talebin alındı! Ödeme altyapımız (sanal POS) şu anda kurulum aşamasında. "
            + "Ekibimiz kısa süre içinde seninle iletişime geçip ödemeni tamamlayacak; onaylandığında "
            + targetPlan.getDisplayName() + " planın otomatik olarak aktifleşecek. Referans kodun: " + reference;

        return new CheckoutResult(false, null, message, reference);
    }

    @Override
    public void cancelSubscription(BusinessSubscription subscription) {
        subscription.scheduleCancel();
    }

    private String generateReference() {
        return "PS-" + (100000 + RANDOM.nextInt(900000));
    }
}
