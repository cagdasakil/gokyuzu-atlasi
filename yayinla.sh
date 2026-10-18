#!/bin/sh
# Siteyi docs/ klasörüne hazırlar ve GitHub'a gönderir.
# Kullanım: ./yayinla.sh "ne değişti"
set -e
cd "$(dirname "$0")"
mkdir -p docs
{ printf '<!doctype html>\n<html lang="tr">\n'; cat gokyuzu.html; } > docs/index.html
{ printf '<!doctype html>\n<html lang="tr">\n'; cat kara-delik.html; } > docs/kara-delik.html
cp gokyuzu-veri.js gokyuzu-veri-derin.js docs/
touch docs/.nojekyll
git add -A
git commit -q -m "${1:-Siteyi güncelle}" || echo "Değişiklik yok."
git push -q
echo "Gönderildi. Site 1-2 dakika içinde güncellenir."
