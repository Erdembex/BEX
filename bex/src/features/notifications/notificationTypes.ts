import { NotificationType } from '@/types';

const TYPE_MAP: Record<string, NotificationType> = {
  APPLICATION_RECEIVED: 'general',
  APPLICATION_ACCEPTED: 'application_approved',
  APPLICATION_REJECTED: 'application_rejected',
  SUBMISSION_SUBMITTED: 'general',
  SUBMISSION_APPROVED: 'application_approved',
  SUBMISSION_REJECTED: 'general',
  KYC_VERIFICATION_PENDING: 'general',
  KYC_VERIFICATION_APPROVED: 'kyc_result',
  KYC_VERIFICATION_REJECTED: 'kyc_result',
  NEW_MESSAGE: 'message',
  OFFER_RECEIVED: 'message',
  OFFER_ACCEPTED: 'message',
  OFFER_REJECTED: 'message',
  COUPON_ISSUED: 'coupon_issued',
  COUPON_EXPIRING_SOON: 'general',
  COUPON_EXPIRED: 'general',
  SWAP_OFFER_RECEIVED: 'trade_offer_received',
  SWAP_OFFER_ACCEPTED: 'trade_offer_accepted',
  SWAP_OFFER_REJECTED: 'trade_offer_rejected',
  SWAP_OFFER_MESSAGE: 'trade_offer_message',
  SWAP_COMPLETED: 'trade_offer_accepted',
  SUBSCRIPTION_RENEWED: 'general',
  SUBSCRIPTION_PAYMENT_FAILED: 'general',
  PLAN_UPGRADED: 'general',
};

export function mapBackendNotificationType(type?: string): NotificationType {
  if (!type) return 'general';
  return TYPE_MAP[type.toUpperCase()] ?? 'general';
}
