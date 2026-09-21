#!/usr/bin/env bash
set -euo pipefail
EMAIL="${1:-admin@bex.dev}"
sudo -u postgres psql -d takkas -c "UPDATE users SET user_type = 'ADMIN' WHERE email = '${EMAIL}';"
sudo -u postgres psql -d takkas -c "SELECT email, user_type FROM users WHERE email = '${EMAIL}';"
