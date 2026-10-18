#!/bin/sh
# Siteyi docs/ klasörüne hazırlar ve GitHub'a gönderir.
# Kullanım: ./yayinla.sh "ne değişti"
set -e
cd "$(dirname "$0")"
mkdir -p docs
{ printf '<!doctype html>\n<html lang="tr">\n<link rel="manifest" href="manifest.webmanifest">\n<link rel="apple-touch-icon" href="apple-touch-icon.png">\n<link rel="icon" href="icon-192.png">\n<meta name="theme-color" content="#04060c">\n<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n<meta name="description" content="Konuma ve saate göre gerçek gökyüzü: 119.625 yıldız, gezegenler, galaksiler, Uzay İstasyonu.">\n'; cat gokyuzu.html; } > docs/index.html
sed "s/SURUM/$(date +%Y%m%d%H%M%S)/" sw-sablon.js > docs/sw.js
{ printf '<!doctype html>\n<html lang="tr">\n'; cat kara-delik.html; } > docs/kara-delik.html
cp gokyuzu-veri.js gokyuzu-veri-derin.js gokyuzu-exo.js gokyuzu-foto.js docs/
mkdir -p docs/foto && cp foto/*.jpg docs/foto/
touch docs/.nojekyll
git add -A
git commit -q -m "${1:-Siteyi güncelle}" || echo "Değişiklik yok."
git push -q
echo "Gönderildi. Site 1-2 dakika içinde güncellenir."
