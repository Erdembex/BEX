#!/usr/bin/env bash
# Production .env şablonu oluşturur (gizli değerleri sen doldurursun)
# Usage: bash deploy/scripts/generate-env.sh api.example.com
set -euo pipefail

API_DOMAIN="${1:-api.bex.app}"
BASE_DOMAIN="${API_DOMAIN#api.}"
JWT_SECRET="$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)"
DB_PASS="$(openssl rand -base64 16 2>/dev/null || head -c 16 /dev/urandom | base64)"

OUT=".env.generated"
cat > "$OUT" <<EOF
# Otomatik üretildi — değerleri kontrol et, sonra .env olarak kaydet
# cp .env.generated .env

DB_NAME=takkas
DB_USER=takkas
DB_PASS=${DB_PASS}
DB_URL=jdbc:postgresql://localhost:5432/takkas

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=${JWT_SECRET}
BASE_URL=https://${API_DOMAIN}

ADMIN_SEED_ENABLED=true
ADMIN_SYNC_PASSWORD=false
ADMIN_EMAIL=admin@${BASE_DOMAIN}
ADMIN_PASSWORD=CHANGE_ME_AFTER_FIRST_LOGIN

LISTINGS_AUTO_APPROVE=false
SWAGGER_ENABLED=false
SPRING_PROFILES_ACTIVE=prod

RATE_LIMIT_ENABLED=true
CORS_ALLOWED_ORIGINS=https://${BASE_DOMAIN},https://www.${BASE_DOMAIN}

STORAGE_PROVIDER=s3
UPLOAD_DIR=/var/takkas/uploads

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=passla-media-prod
AWS_S3_REGION=eu-central-1

SPRING_MAIL_HOST=smtp.sendgrid.net
SPRING_MAIL_PORT=587
SPRING_MAIL_USERNAME=apikey
SPRING_MAIL_PASSWORD=

FIREBASE_SERVICE_ACCOUNT_PATH=/opt/takkas/firebase-sa.json

APP_PAYMENT_PROVIDER=manual
EOF

echo "==> $OUT oluşturuldu"
echo "    AWS, SendGrid ve admin şifresini doldur"
echo "    İlk admin seed sonrası ADMIN_SEED_ENABLED=false yap"
