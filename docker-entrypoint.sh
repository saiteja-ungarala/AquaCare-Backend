#!/bin/sh
set -eu

mkdir -p /app/uploads/agent-kyc /app/uploads/dealer-kyc /app/uploads/banners /app/uploads/products

if [ -d /app/seed-uploads/banners ] && [ -z "$(ls -A /app/uploads/banners 2>/dev/null)" ]; then
  cp -R /app/seed-uploads/banners/. /app/uploads/banners/
fi

if [ -d /app/seed-uploads/products ] && [ -z "$(ls -A /app/uploads/products 2>/dev/null)" ]; then
  cp -R /app/seed-uploads/products/. /app/uploads/products/
fi

exec "$@"
