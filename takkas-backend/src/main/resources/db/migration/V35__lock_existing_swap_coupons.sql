-- Pazarda veya bekleyen teklifte olan mevcut kuponları kilitle
UPDATE coupons c
SET status = 'LOCKED_FOR_SWAP', qr_token = NULL
FROM swap_listings sl
WHERE sl.offered_coupon_id = c.id
  AND sl.status = 'OPEN'
  AND c.status = 'ACTIVE';

UPDATE coupons c
SET status = 'LOCKED_FOR_SWAP', qr_token = NULL
FROM swap_offers so
WHERE so.offered_coupon_id = c.id
  AND so.status = 'PENDING'
  AND c.status = 'ACTIVE';
