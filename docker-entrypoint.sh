#!/bin/sh

echo "Replacing environment variables in static files..."

# Replace placeholders in all HTML and JS files
for file in /usr/share/nginx/html/**/*.html /usr/share/nginx/html/**/*.js; do
  if [ -f "$file" ]; then
    sed -i "s|__FIREBASE_API_KEY__|${FIREBASE_API_KEY:-}|g" "$file"
    sed -i "s|__FIREBASE_AUTH_DOMAIN__|${FIREBASE_AUTH_DOMAIN:-}|g" "$file"
    sed -i "s|__FIREBASE_PROJECT_ID__|${FIREBASE_PROJECT_ID:-}|g" "$file"
    sed -i "s|__FIREBASE_STORAGE_BUCKET__|${FIREBASE_STORAGE_BUCKET:-}|g" "$file"
    sed -i "s|__FIREBASE_MESSAGING_SENDER_ID__|${FIREBASE_MESSAGING_SENDER_ID:-}|g" "$file"
    sed -i "s|__FIREBASE_APP_ID__|${FIREBASE_APP_ID:-}|g" "$file"
  fi
done

echo "Starting nginx..."
exec nginx -g "daemon off;"
