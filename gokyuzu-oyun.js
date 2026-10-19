/* Gökyüzü Atlası · Uzay mekiği
   Fly a shuttle through the Solar System and jump to nearby stars; every arrival opens a discovery card,
   a badge and one quiz question. Needs three.js (r149, UMD) loaded before GKGame.open() is called. */
(() => {
'use strict';
let THREE = null, G = null, LANG = 'tr';
const L = (tr, en) => LANG === 'en' ? en : tr;
const D2R = Math.PI/180, EPS = 23.4393*D2R;

/* ---------------- destinations ---------------- */
// orbit radius / body radius are game units, compressed so a trip takes seconds; the cards carry the real numbers
const PLANETS = [
  { id: 'Mercury', tr: 'Mercury', orbit: 420, r: 6, tex: 'mercury', day: 58.6, tilt: 0 },
  { id: 'Venus', tr: 'Venus', orbit: 620, r: 13, tex: 'venus', day: -243, tilt: 177, atm: [1.0, 0.85, 0.55] },
  { id: 'Earth', tr: 'Dünya', en: 'Earth', orbit: 840, r: 14, tex: 'earth', day: 1, tilt: 23.4, atm: [0.35, 0.6, 1.0] },
  { id: 'Mars', tr: 'Mars', orbit: 1080, r: 9, tex: 'mars', day: 1.03, tilt: 25, atm: [1.0, 0.55, 0.35] },
  { id: 'Ceres', tr: 'Ceres', orbit: 1380, r: 3.2, tex: 'ceres', day: 0.38, tilt: 4 },
  { id: 'Jupiter', tr: 'Jupiter', orbit: 1950, r: 44, tex: 'jupiter', day: 0.41, tilt: 3, atm: [1.0, 0.85, 0.65] },
  { id: 'Saturn', tr: 'Saturn', orbit: 2750, r: 37, tex: 'saturn', day: 0.44, tilt: 26.7, ring: [1.25, 2.3], atm: [1.0, 0.9, 0.65] },
  { id: 'Uranus', tr: 'Uranus', orbit: 3550, r: 22, tex: 'uranus', day: -0.72, tilt: 97.8, ring: [1.6, 1.9], atm: [0.6, 0.95, 1.0] },
  { id: 'Neptune', tr: 'Neptune', orbit: 4350, r: 21, tex: 'neptune', day: 0.67, tilt: 28, atm: [0.4, 0.55, 1.0] }
];
const STARSYS = {
  AlphaCen: { ra: 219.90, dec: -60.83, ly: 4.37 }, Sirius: { ra: 101.287, dec: -16.716, ly: 8.6 },
  Vega: { ra: 279.235, dec: 38.784, ly: 25 }, Betelgeuse: { ra: 88.793, dec: 7.407, ly: 550 }
};
// cards: name, kind, three facts, real numbers, one quiz question (first answer is the right one; shuffled on screen)
const INFO = {
  Sun: { n: ['Güneş', 'Sun'], k: ['Yıldız', 'Star'],
    f: [['Güneş Sistemi\'ndeki bütün kütlenin %99,8\'i Güneş\'tedir.', 'The Sun holds 99.8% of all the mass in the Solar System.'],
        ['Işığı Dünya\'ya yaklaşık 8 dakika 20 saniyede ulaşır.', 'Its light reaches Earth in about 8 minutes 20 seconds.'],
        ['Çekirdeğinde sıcaklık yaklaşık 15 milyon °C; orada her saniye 600 milyon ton hidrojen helyuma dönüşür.', 'Its core is about 15 million °C; there, 600 million tonnes of hydrogen turn into helium every second.']],
    s: ['Çap: 1,39 milyon km · Yüzey: ~5.500 °C · Yaş: 4,6 milyar yıl', 'Diameter: 1.39 million km · Surface: ~5,500 °C · Age: 4.6 billion years'],
    q: ['Güneş ışığı Dünya\'ya yaklaşık ne kadar sürede ulaşır?', 'About how long does sunlight take to reach Earth?'], a: [['8 dakika', '8 minutes'], ['1 saat', '1 hour'], ['1 gün', '1 day']] },
  Mercury: { n: ['Mercury', 'Mercury'], k: ['Gezegen', 'Planet'],
    f: [['Güneş\'e en yakın ve en küçük gezegendir.', 'The closest planet to the Sun, and the smallest.'],
        ['Bir yılı sadece 88 gün sürer.', 'A year there lasts only 88 days.'],
        ['Neredeyse hiç havası yoktur: gündüz 430 °C, gece −180 °C olur.', 'It has almost no air: 430 °C by day, −180 °C at night.']],
    s: ['Çap: 4.879 km · Güneş\'e uzaklık: 58 milyon km · Uydu: yok', 'Diameter: 4,879 km · From the Sun: 58 million km · Moons: none'],
    q: ['Mercury\'de bir yıl kaç gün sürer?', 'How many days is a year on Mercury?'], a: [['88', '88'], ['365', '365'], ['225', '225']] },
  Venus: { n: ['Venus', 'Venus'], k: ['Gezegen', 'Planet'],
    f: [['Güneş Sistemi\'nin en sıcak gezegeni: yüzey 465 °C, kurşunu eritir.', 'The hottest planet: the surface is 465 °C, hot enough to melt lead.'],
        ['Kalın karbondioksit bulutları ısıyı hapseder; bu, sera etkisinin en uç örneği.', 'Thick carbon dioxide clouds trap the heat: the greenhouse effect at its most extreme.'],
        ['Ters yöne döner ve bir günü (243 gün) bir yılından (225 gün) uzundur.', 'It spins backwards, and its day (243 days) is longer than its year (225 days).']],
    s: ['Çap: 12.104 km · Güneş\'e uzaklık: 108 milyon km · Uydu: yok', 'Diameter: 12,104 km · From the Sun: 108 million km · Moons: none'],
    q: ['Güneş Sistemi\'nin en sıcak gezegeni hangisi?', 'Which is the hottest planet in the Solar System?'], a: [['Venus', 'Venus'], ['Mercury', 'Mercury'], ['Mars', 'Mars']] },
  Earth: { n: ['Dünya', 'Earth'], k: ['Gezegen · evimiz', 'Planet · home'],
    f: [['Yaşam olduğunu bildiğimiz tek yer.', 'The only place where we know life exists.'],
        ['Yüzeyinin yaklaşık %71\'i suyla kaplı.', 'About 71% of its surface is covered by water.'],
        ['Güneş\'in etrafında saatte yaklaşık 107.000 km hızla dolanır.', 'It travels around the Sun at about 107,000 km per hour.']],
    s: ['Çap: 12.742 km · Güneş\'e uzaklık: 150 milyon km · Uydu: 1 (Ay)', 'Diameter: 12,742 km · From the Sun: 150 million km · Moons: 1'],
    q: ['Dünya yüzeyinin yaklaşık ne kadarı suyla kaplı?', 'About how much of Earth\'s surface is water?'], a: [['%71', '71%'], ['%50', '50%'], ['%90', '90%']] },
  Moon: { n: ['Ay', 'Moon'], k: ['Uydu', 'Moon'],
    f: [['Dünya\'dan ortalama 384.400 km uzakta.', 'It is on average 384,400 km from Earth.'],
        ['Dünya\'ya hep aynı yüzünü gösterir.', 'It always shows the same face to Earth.'],
        ['1969–1972 arasında 12 astronot Ay\'da yürüdü.', 'Between 1969 and 1972, 12 astronauts walked on it.']],
    s: ['Çap: 3.474 km · Yerçekimi: Dünya\'nın 1/6\'sı', 'Diameter: 3,474 km · Gravity: 1/6 of Earth\'s'],
    q: ['Ay\'da bugüne kadar kaç kişi yürüdü?', 'How many people have walked on the Moon?'], a: [['12', '12'], ['2', '2'], ['24', '24']] },
  Mars: { n: ['Mars', 'Mars'], k: ['Gezegen', 'Planet'],
    f: [['Rengini toprağındaki pastan (demir oksit) alır.', 'Its colour comes from rust (iron oxide) in its soil.'],
        ['Olympus Mons, yaklaşık 22 km yüksekliğiyle Güneş Sistemi\'nin en büyük yanardağıdır.', 'Olympus Mons, about 22 km high, is the largest volcano in the Solar System.'],
        ['İki küçük uydusu var: Phobos ve Deimos.', 'It has two small moons: Phobos and Deimos.']],
    s: ['Çap: 6.779 km · Güneş\'e uzaklık: 228 milyon km · Gün: 24 sa 37 dk', 'Diameter: 6,779 km · From the Sun: 228 million km · Day: 24 h 37 min'],
    q: ['Mars neden kırmızı görünür?', 'Why does Mars look red?'], a: [['Toprağı paslı (demir oksit)', 'Its soil is rusty (iron oxide)'], ['Yüzeyi lavla kaplı', 'It is covered in lava'], ['Çok sıcak olduğu için', 'Because it is very hot']] },
  Ceres: { n: ['Ceres', 'Ceres'], k: ['Cüce gezegen · asteroit kuşağı', 'Dwarf planet · asteroid belt'],
    f: [['Mars ile Jupiter arasındaki asteroit kuşağının en büyük cismi.', 'The largest object in the asteroid belt between Mars and Jupiter.'],
        ['1801\'de keşfedildi; ilk bulunan asteroittir.', 'Found in 1801, it was the first asteroid ever discovered.'],
        ['Dawn uzay aracı 2015\'te yörüngesine girdi ve yüzeyinde parlak tuz birikintileri gördü.', 'The Dawn spacecraft orbited it from 2015 and saw bright salt deposits on its surface.']],
    s: ['Çap: ~940 km · Güneş\'e uzaklık: 414 milyon km', 'Diameter: ~940 km · From the Sun: 414 million km'],
    q: ['Ceres nedir?', 'What is Ceres?'], a: [['Cüce gezegen', 'A dwarf planet'], ['Bir uydu', 'A moon'], ['Kuyruklu yıldız', 'A comet']] },
  Jupiter: { n: ['Jupiter', 'Jupiter'], k: ['Gaz devi', 'Gas giant'],
    f: [['Güneş Sistemi\'nin en büyük gezegeni: içine 1.300\'den fazla Dünya sığar.', 'The largest planet: more than 1,300 Earths would fit inside.'],
        ['Büyük Kırmızı Leke, Dünya\'dan büyük ve yüzyıllardır süren dev bir fırtınadır.', 'The Great Red Spot is a giant storm, bigger than Earth, that has raged for centuries.'],
        ['90\'dan fazla uydusu var; Europa\'nın buzunun altında okyanus olduğu düşünülüyor.', 'It has more than 90 moons; Europa is thought to hide an ocean under its ice.']],
    s: ['Çap: 139.820 km · Güneş\'e uzaklık: 778 milyon km · Gün: 9 sa 56 dk', 'Diameter: 139,820 km · From the Sun: 778 million km · Day: 9 h 56 min'],
    q: ['Büyük Kırmızı Leke nedir?', 'What is the Great Red Spot?'], a: [['Dev bir fırtına', 'A giant storm'], ['Bir yanardağ', 'A volcano'], ['Bir okyanus', 'An ocean']] },
  Saturn: { n: ['Saturn', 'Saturn'], k: ['Gaz devi', 'Gas giant'],
    f: [['Halkaları çoğunlukla buz ve kaya parçalarından oluşur.', 'Its rings are made mostly of chunks of ice and rock.'],
        ['Halkalar yüz binlerce km genişliğinde ama çoğu yerde ancak birkaç on metre kalınlığında.', 'The rings are hundreds of thousands of km wide but mostly only tens of metres thick.'],
        ['Ortalama yoğunluğu sudan düşüktür; dev bir küvet olsa yüzerdi.', 'Its average density is lower than water: it would float in a giant bathtub.']],
    s: ['Çap: 116.460 km · Güneş\'e uzaklık: 1,4 milyar km · Uydu: 140\'tan fazla', 'Diameter: 116,460 km · From the Sun: 1.4 billion km · Moons: more than 140'],
    q: ['Saturn\'ün halkaları çoğunlukla nelerden oluşur?', 'What are Saturn\'s rings mostly made of?'], a: [['Buz ve kaya', 'Ice and rock'], ['Gaz', 'Gas'], ['Kum fırtınası', 'A sandstorm']] },
  Uranus: { n: ['Uranus', 'Uranus'], k: ['Buz devi', 'Ice giant'],
    f: [['Yan yatmış halde döner: ekseni 98° eğik.', 'It spins on its side: its axis is tilted 98°.'],
        ['1781\'de William Herschel teleskopla buldu; teleskopla keşfedilen ilk gezegen.', 'William Herschel found it in 1781: the first planet discovered with a telescope.'],
        ['Atmosferi −224 °C ile Güneş Sistemi\'nin en soğuğu.', 'Its atmosphere, at −224 °C, is the coldest in the Solar System.']],
    s: ['Çap: 50.724 km · Güneş\'e uzaklık: 2,9 milyar km · Yıl: 84 Dünya yılı', 'Diameter: 50,724 km · From the Sun: 2.9 billion km · Year: 84 Earth years'],
    q: ['Uranus\'u özel yapan nedir?', 'What makes Uranus special?'], a: [['Yan yatmış döner', 'It spins on its side'], ['Hiç dönmez', 'It does not spin'], ['Kayalık bir gezegendir', 'It is a rocky planet']] },
  Neptune: { n: ['Neptune', 'Neptune'], k: ['Buz devi', 'Ice giant'],
    f: [['Rüzgârları saatte 2.000 km\'yi aşar; Güneş Sistemi\'nin en hızlısı.', 'Its winds pass 2,000 km per hour, the fastest in the Solar System.'],
        ['1846\'da önce matematikle hesaplandı, sonra teleskopla görüldü.', 'In 1846 it was first predicted with mathematics, then seen through a telescope.'],
        ['Güneş\'in etrafında bir turu 165 Dünya yılı sürer.', 'One trip around the Sun takes 165 Earth years.']],
    s: ['Çap: 49.244 km · Güneş\'e uzaklık: 4,5 milyar km · Uydu: 16', 'Diameter: 49,244 km · From the Sun: 4.5 billion km · Moons: 16'],
    q: ['Neptune\'de bir yıl kaç Dünya yılı sürer?', 'How many Earth years is one year on Neptune?'], a: [['165', '165'], ['12', '12'], ['84', '84']] },
  AlphaCen: { n: ['Alpha Centauri', 'Alpha Centauri'], k: ['Üçlü yıldız sistemi', 'Triple star system'],
    f: [['Güneş\'e en yakın yıldız sistemi: 4,37 ışık yılı.', 'The nearest star system to the Sun: 4.37 light-years.'],
        ['Üç yıldızı var; en küçüğü Proxima Centauri, Güneş\'e en yakın tek yıldızdır (4,24 ışık yılı).', 'It has three stars; the smallest, Proxima Centauri, is the single closest star to the Sun (4.24 light-years).'],
        ['Proxima b gezegeni, suyun sıvı kalabileceği bölgede dolanıyor.', 'The planet Proxima b orbits in the zone where water could stay liquid.']],
    s: ['Bugünkü en hızlı uzay aracıyla bile varmak binlerce yıl sürerdi.', 'Even our fastest spacecraft would need thousands of years to get there.'],
    q: ['Güneş\'e en yakın yıldız hangisi?', 'Which star is closest to the Sun?'], a: [['Proxima Centauri', 'Proxima Centauri'], ['Sirius', 'Sirius'], ['Vega', 'Vega']] },
  Sirius: { n: ['Sirius', 'Sirius'], k: ['Çift yıldız', 'Double star'],
    f: [['Gece gökyüzünün en parlak yıldızı.', 'The brightest star in the night sky.'],
        ['8,6 ışık yılı uzakta; Güneş\'ten yaklaşık 25 kat parlak.', '8.6 light-years away and about 25 times brighter than the Sun.'],
        ['Yanında Dünya boyutunda ama çok yoğun bir beyaz cüce var: Sirius B.', 'It has an Earth-sized but extremely dense white dwarf companion: Sirius B.']],
    s: ['Kütle: 2 Güneş · Yüzey: ~9.900 °C', 'Mass: 2 Suns · Surface: ~9,900 °C'],
    q: ['Gece gökyüzünün en parlak yıldızı hangisi?', 'Which is the brightest star in the night sky?'], a: [['Sirius', 'Sirius'], ['Polaris', 'Polaris'], ['Betelgeuse', 'Betelgeuse']] },
  Vega: { n: ['Vega', 'Vega'], k: ['Beyaz yıldız', 'White star'],
    f: [['25 ışık yılı uzakta; yaz üçgeninin en parlak yıldızı.', '25 light-years away; the brightest star of the Summer Triangle.'],
        ['Dünya\'nın ekseni yalpaladığı için yaklaşık 12.000 yıl sonra kutup yıldızı olacak.', 'Because Earth\'s axis wobbles, it will be the pole star in about 12,000 years.'],
        ['Etrafında gezegen oluşumundan kalan bir toz diski var.', 'It is surrounded by a disc of dust left over from planet formation.']],
    s: ['Güneş\'ten fotoğrafı çekilen ilk yıldız (1850).', 'The first star after the Sun ever photographed (1850).'],
    q: ['Vega yaklaşık 12.000 yıl sonra ne olacak?', 'What will Vega become in about 12,000 years?'], a: [['Kutup yıldızı', 'The pole star'], ['Süpernova', 'A supernova'], ['Kara delik', 'A black hole']] },
  Betelgeuse: { n: ['Betelgeuse', 'Betelgeuse'], k: ['Kırmızı süperdev', 'Red supergiant'],
    f: [['Güneş\'in yerinde olsaydı Mars\'ın yörüngesini aşardı.', 'Placed where the Sun is, it would reach beyond the orbit of Mars.'],
        ['Ömrünün sonuna yaklaşıyor; önümüzdeki 100.000 yıl içinde süpernova olarak patlayacak.', 'It is near the end of its life and will explode as a supernova within the next 100,000 years.'],
        ['2019–2020\'de gözle görülür biçimde sönükleşti: yıldız büyük bir toz bulutu püskürtmüştü.', 'In 2019–2020 it visibly dimmed after puffing out a huge cloud of dust.']],
    s: ['Uzaklık: ~550 ışık yılı · Çap: Güneş\'in ~750 katı', 'Distance: ~550 light-years · Diameter: ~750 times the Sun'],
    q: ['Betelgeuse ne tür bir yıldız?', 'What kind of star is Betelgeuse?'], a: [['Kırmızı süperdev', 'A red supergiant'], ['Beyaz cüce', 'A white dwarf'], ['Nötron yıldızı', 'A neutron star']] }
};
const ORDER = ['Earth', 'Moon', 'Mars', 'Venus', 'Mercury', 'Sun', 'Ceres', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'AlphaCen', 'Sirius', 'Vega', 'Betelgeuse'];
const nm = id => INFO[id].n[LANG === 'en' ? 1 : 0], tx2 = p => p[LANG === 'en' ? 1 : 0];

/* ---------------- progress ---------------- */
const SAVE_KEY = 'gk_ship';
let PROG = { found: {}, quiz: {}, seen: false };
try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (s) PROG = Object.assign(PROG, s); } catch (e) {}
const save = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(PROG)); } catch (e) {} };

/* ---------------- noise and procedural textures ---------------- */
function hash3(x, y, z) { let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1440662683); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0)/4294967296; }
function noise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf*xf*(3 - 2*xf), v = yf*yf*(3 - 2*yf), w = zf*zf*(3 - 2*zf), l = (a, b, t) => a + (b - a)*t;
  return l(l(l(hash3(xi, yi, zi), hash3(xi + 1, yi, zi), u), l(hash3(xi, yi + 1, zi), hash3(xi + 1, yi + 1, zi), u), v),
           l(l(hash3(xi, yi, zi + 1), hash3(xi + 1, yi, zi + 1), u), l(hash3(xi, yi + 1, zi + 1), hash3(xi + 1, yi + 1, zi + 1), u), v), w);
}
function fbm(x, y, z, o = 5) { let a = 0.5, s = 0, f = 1; for (let i = 0; i < o; i++) { s += a*noise3(x*f, y*f, z*f); f *= 2.03; a *= 0.5; } return s/(1 - Math.pow(0.5, o)); }
const sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a)/(b - a))); return t*t*(3 - 2*t); };
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0])*t, a[1] + (b[1] - a[1])*t, a[2] + (b[2] - a[2])*t];
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
// paint an equirectangular map: fn(x, y, z, lat) on the unit sphere -> [r, g, b, a?] in 0..255
function paint(w, h, fn) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'), im = g.createImageData(w, h), d = im.data;
  for (let j = 0; j < h; j++) { const lat = (0.5 - (j + 0.5)/h)*Math.PI, cl = Math.cos(lat), y = Math.sin(lat);
    for (let i = 0; i < w; i++) { const lon = (i + 0.5)/w*Math.PI*2, x = cl*Math.cos(lon), z = cl*Math.sin(lon), p = fn(x, y, z, lat, lon), k = (j*w + i)*4;
      d[k] = p[0]; d[k + 1] = p[1]; d[k + 2] = p[2]; d[k + 3] = p.length > 3 ? p[3] : 255; } }
  g.putImageData(im, 0, 0);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t;
}
function bands(cols, y, n, warp, k) { const t = (y*k + n*warp + 8)*cols.length; const i = Math.floor(t), f = t - i; return mix3(cols[((i % cols.length) + cols.length) % cols.length], cols[(((i + 1) % cols.length) + cols.length) % cols.length], sm(0, 1, f)); }
const TEX = {
  mercury: () => paint(256, 128, (x, y, z) => { const n = fbm(x*4, y*4, z*4), c = Math.abs(noise3(x*14, y*14, z*14) - 0.5); const v = 95 + n*90 - (c < 0.06 ? 30 : 0); return [v*1.02, v*0.97, v*0.92]; }),
  ceres: () => paint(256, 128, (x, y, z) => { const n = fbm(x*5, y*5, z*5), c = Math.abs(noise3(x*16, y*16, z*16) - 0.5), b = noise3(x*30 + 9, y*30, z*30) > 0.93 ? 120 : 0; const v = 70 + n*60 - (c < 0.05 ? 20 : 0) + b; return [v, v*0.98, v*0.95]; }),
  venus: () => paint(256, 128, (x, y, z) => { const w = fbm(x*2 + 3, y*2, z*2), n = fbm(x*3 + w*2, y*6 + w, z*3); return mix3(hex('#b98d4f'), hex('#f2deae'), sm(0.3, 0.75, n)); }),
  earth: () => paint(512, 256, (x, y, z, lat) => {
    const h = fbm(x*2.1 + 11, y*2.1, z*2.1, 6), al = Math.abs(lat)/(Math.PI/2);
    if (al > 0.86 + (h - 0.5)*0.15) return [235, 242, 250];
    if (h < 0.53) { const d = sm(0.3, 0.53, h); return mix3(hex('#08214f'), hex('#1d5fa3'), d); }
    const dry = sm(0.15, 0.45, 1 - Math.abs(al - 0.28)*3) * sm(0.5, 0.8, fbm(x*5, y*5, z*5 + 4));
    return mix3(mix3(hex('#2f6b2a'), hex('#5c7d34'), sm(0.53, 0.68, h)), hex('#b89a63'), dry*0.85); }),
  clouds: () => paint(512, 256, (x, y, z) => { const n = fbm(x*3 + 5, y*5, z*3, 6); const a = sm(0.5, 0.78, n)*255; return [255, 255, 255, a]; }),
  mars: () => paint(512, 256, (x, y, z, lat) => { const n = fbm(x*3, y*3, z*3, 6), d = fbm(x*2 + 7, y*2, z*2), al = Math.abs(lat)/(Math.PI/2);
    if (al > 0.9 + (n - 0.5)*0.1) return [238, 232, 228];
    return mix3(mix3(hex('#9c3c17'), hex('#d9784a'), n), hex('#4f2414'), sm(0.55, 0.75, d)*0.75); }),
  jupiter: () => paint(512, 256, (x, y, z, lat, lon) => {
    const n = fbm(x*4, y*9, z*4); let c = bands([hex('#e9dcc4'), hex('#c49a6c'), hex('#f3ead8'), hex('#a8714a'), hex('#e2c9a3'), hex('#8c5a3c')], y, n, 0.06, 1.15);
    const dl = (lat + 22*D2R)/0.07, dn = Math.atan2(Math.sin(lon - 3.6), Math.cos(lon - 3.6))/0.16, e = dl*dl + dn*dn;
    if (e < 1) c = mix3(c, hex('#b4482c'), sm(1, 0.3, e)); return c; }),
  saturn: () => paint(512, 256, (x, y, z) => { const n = fbm(x*4, y*10, z*4); return bands([hex('#f1e2b8'), hex('#d8bd84'), hex('#efe0bd'), hex('#c7a66a'), hex('#e6d2a2')], y, n, 0.04, 0.9); }),
  uranus: () => paint(256, 128, (x, y, z) => { const n = fbm(x*3, y*12, z*3); return mix3(hex('#8fd6de'), hex('#b8eef0'), sm(0.35, 0.7, n)*0.6 + y*0.15); }),
  neptune: () => paint(256, 128, (x, y, z, lat, lon) => { const n = fbm(x*3, y*10, z*3); let c = mix3(hex('#2c4fc2'), hex('#5b84ea'), sm(0.3, 0.75, n));
    const dl = (lat + 20*D2R)/0.09, dn = Math.atan2(Math.sin(lon - 1.2), Math.cos(lon - 1.2))/0.2; if (dl*dl + dn*dn < 1) c = mix3(c, hex('#1a2a72'), 0.7); return c; }),
  moon: () => paint(256, 128, (x, y, z) => { const n = fbm(x*3, y*3, z*3), m = sm(0.55, 0.62, fbm(x*1.5 + 4, y*1.5, z*1.5)), c = Math.abs(noise3(x*18, y*18, z*18) - 0.5); const v = 150 + n*60 - m*60 - (c < 0.05 ? 25 : 0); return [v, v, v*0.98]; }),
  rock: () => paint(256, 128, (x, y, z) => { const n = fbm(x*4, y*4, z*4), v = 60 + n*80; return [v*1.05, v, v*0.92]; })
};
function glowTex(stops) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  stops.forEach(([o, col]) => gr.addColorStop(o, col)); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
}

/* ---------------- shaders ---------------- */
const GL_NOISE = `
float h3(vec3 p){ p = fract(p*0.3183099 + 0.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x + p.y + p.z)); }
float n3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f*f*(3.0 - 2.0*f);
  return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z); }
float fb(vec3 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a*n3(p); p = p*2.03 + 1.7; a *= 0.5; } return s; }`;
const STARSURF = {
  vertexShader: `varying vec3 vP; varying vec3 vN; varying vec3 vV;
    void main(){ vP = position; vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position, 1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
  fragmentShader: `uniform float uT; uniform vec3 uC1; uniform vec3 uC2; uniform float uScale; varying vec3 vP; varying vec3 vN; varying vec3 vV;` + GL_NOISE + `
    void main(){ vec3 p = normalize(vP)*uScale; float n = fb(p + vec3(0.0, uT*0.05, uT*0.03)), g = fb(p*3.0 - uT*0.08);
      float mu = clamp(dot(vN, vV), 0.0, 1.0);
      vec3 c = mix(uC2, uC1, smoothstep(0.25, 0.8, n*0.7 + g*0.45));
      c *= 0.55 + 0.45*pow(mu, 0.45);
      gl_FragColor = vec4(c*1.25, 1.0); }`
};
const ATM = {
  vertexShader: `varying vec3 vN; varying vec3 vV; varying vec3 vW;
    void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position, 1.0); vV = normalize(-mv.xyz); vW = normalize(mat3(modelMatrix)*normal); gl_Position = projectionMatrix*mv; }`,
  fragmentShader: `uniform vec3 uC; uniform vec3 uSun; varying vec3 vN; varying vec3 vV; varying vec3 vW;
    void main(){ float r = 1.0 - abs(dot(vN, vV)); float i = pow(r, 2.6); float lit = 0.25 + 0.75*smoothstep(-0.4, 0.5, dot(vW, uSun));
      gl_FragColor = vec4(uC, i*lit*0.7); }`
};
const PTS = {
  vertexShader: `attribute float aSize; attribute vec3 aCol; attribute float aA; uniform float uPx; uniform float uAtt; varying vec3 vC; varying float vA;
    void main(){ vec4 mv = modelViewMatrix*vec4(position, 1.0); gl_Position = projectionMatrix*mv;
      float s = uAtt > 0.0 ? aSize*uAtt/max(1.0, -mv.z) : aSize*uPx; gl_PointSize = clamp(s, 0.0, 200.0); vC = aCol; vA = aA*smoothstep(0.0, 1.5, s); }`,
  fragmentShader: `varying vec3 vC; varying float vA;
    void main(){ vec2 d = gl_PointCoord - 0.5; float r = length(d)*2.0; if (r > 1.0) discard; float a = exp(-r*r*5.0) + 0.25*exp(-r*r*40.0); gl_FragColor = vec4(vC, a*vA); }`
};
function ptsMat(att) {
  return new THREE.ShaderMaterial({ uniforms: { uPx: { value: 1 }, uAtt: { value: att ? 1 : 0 } }, vertexShader: PTS.vertexShader, fragmentShader: PTS.fragmentShader,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
}
function ptsGeo(n) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n*3), 3)); g.setAttribute('aCol', new THREE.BufferAttribute(new Float32Array(n*3), 3));
  g.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(n), 1)); g.setAttribute('aA', new THREE.BufferAttribute(new Float32Array(n), 1)); return g;
}

/* ---------------- coordinates ---------------- */
// game frame: ecliptic plane = XZ, ecliptic north = +Y
const ecl2game = v => new THREE.Vector3(v[0], v[2], -v[1]);
function eq2game(v) { const ce = Math.cos(EPS), se = Math.sin(EPS); return ecl2game([v[0], v[1]*ce + v[2]*se, -v[1]*se + v[2]*ce]); }
const eqv = (ra, dec) => { const a = ra*D2R, d = dec*D2R, c = Math.cos(d); return [c*Math.cos(a), c*Math.sin(a), Math.sin(d)]; };

/* ---------------- CSS + DOM ---------------- */
const CSS = `
#gk { position: fixed; inset: 0; z-index: 60; background: #000; color: #e9e4d8; font-family: var(--f-ui, Manrope, sans-serif); touch-action: none; overflow: hidden; -webkit-user-select: none; user-select: none; }
#gk canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
#gk .cock { position: absolute; inset: 0; pointer-events: none; }
#gk .flash { position: absolute; inset: 0; pointer-events: none; opacity: 0; transition: opacity .25s; }
#gk .top { position: absolute; top: max(10px, env(safe-area-inset-top)); left: 12px; right: 12px; display: flex; align-items: flex-start; gap: 8px; pointer-events: none; }
#gk .top > * { pointer-events: auto; }
#gk .b { border: 1px solid rgba(227,194,126,.35); background: rgba(8,10,20,.62); color: #e9e4d8; border-radius: 999px; padding: 8px 13px; font: 600 13px var(--f-ui, Manrope, sans-serif); cursor: pointer; backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); white-space: nowrap; }
#gk .b.on { background: rgba(227,194,126,.9); color: #14110a; border-color: transparent; }
#gk .b:active { transform: scale(.97); }
#gk .tgt { flex: 1; min-width: 0; text-align: center; pointer-events: none !important; }
#gk .tgt .k { font: 600 10.5px var(--f-ui, Manrope); letter-spacing: .16em; text-transform: uppercase; color: #8e93a3; }
#gk .tgt .n { font: italic 600 24px var(--f-name, Georgia, serif); color: #e3c27e; line-height: 1.1; text-shadow: 0 1px 8px #000; }
#gk .tgt .d { font: 500 12px var(--f-num, Menlo, monospace); color: #c9c4b6; text-shadow: 0 1px 6px #000; }
#gk .dash { position: absolute; left: 0; right: 0; bottom: max(12px, env(safe-area-inset-bottom)); display: flex; justify-content: center; align-items: flex-end; gap: 10px; pointer-events: none; padding: 0 12px; }
#gk .dash > * { pointer-events: auto; }
#gk .gauge { min-width: 150px; padding: 8px 12px; border-radius: 12px; background: rgba(8,10,20,.6); border: 1px solid rgba(227,194,126,.22); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); pointer-events: none !important; }
#gk .gauge .l { display: flex; justify-content: space-between; font: 600 10px var(--f-ui, Manrope); letter-spacing: .12em; text-transform: uppercase; color: #8e93a3; margin-top: 4px; }
#gk .gauge .l:first-child { margin-top: 0; }
#gk .bar { height: 5px; border-radius: 3px; background: rgba(255,255,255,.08); overflow: hidden; margin-top: 3px; }
#gk .bar i { display: block; height: 100%; width: 0; background: linear-gradient(90deg, #6fb3ff, #e3c27e); border-radius: 3px; }
#gk .bar.sh i { background: linear-gradient(90deg, #ff6b5a, #7ef0c2); }
#gk .thr { position: absolute; right: 14px; bottom: calc(max(12px, env(safe-area-inset-bottom)) + 70px); width: 46px; height: 190px; border-radius: 23px; background: rgba(8,10,20,.6); border: 1px solid rgba(227,194,126,.3); touch-action: none; }
#gk .thr i { position: absolute; left: 4px; right: 4px; bottom: 4px; border-radius: 19px; background: linear-gradient(0deg, rgba(111,179,255,.5), rgba(227,194,126,.85)); }
#gk .thr span { position: absolute; left: 0; right: 0; top: -20px; text-align: center; font: 600 10px var(--f-ui, Manrope); letter-spacing: .1em; color: #8e93a3; }
#gk .turbo { position: absolute; right: 70px; bottom: calc(max(12px, env(safe-area-inset-bottom)) + 76px); width: 64px; height: 64px; border-radius: 50%; border: 1px solid rgba(227,194,126,.5); background: rgba(8,10,20,.6); color: #e3c27e; font: 700 12px var(--f-ui, Manrope); touch-action: none; }
#gk .turbo.on { background: rgba(227,194,126,.9); color: #14110a; }
#gk .joy { position: absolute; width: 120px; height: 120px; margin: -60px 0 0 -60px; border-radius: 50%; border: 1px solid rgba(227,194,126,.35); background: rgba(8,10,20,.25); pointer-events: none; display: none; }
#gk .joy i { position: absolute; left: 50%; top: 50%; width: 44px; height: 44px; margin: -22px 0 0 -22px; border-radius: 50%; background: rgba(227,194,126,.55); }
#gk .hint { position: absolute; left: 50%; bottom: calc(max(12px, env(safe-area-inset-bottom)) + 92px); transform: translateX(-50%); font: 500 12px var(--f-ui, Manrope); color: #8e93a3; text-align: center; pointer-events: none; text-shadow: 0 1px 6px #000; width: min(92vw, 520px); transition: opacity .6s; }
#gk .msg { position: absolute; left: 50%; top: 38%; transform: translate(-50%, -50%); text-align: center; pointer-events: none; font: italic 600 46px var(--f-name, Georgia, serif); color: #e3c27e; text-shadow: 0 2px 20px #000; opacity: 0; transition: opacity .4s; width: 92vw; }
#gk .msg small { display: block; font: 500 14px var(--f-ui, Manrope); font-style: normal; color: #c9c4b6; margin-top: 8px; }
#gk .card { position: absolute; left: 50%; bottom: max(14px, env(safe-area-inset-bottom)); transform: translate(-50%, 30px); width: min(520px, calc(100vw - 24px)); max-height: calc(100vh - 110px); overflow: auto; padding: 18px 18px 16px; border-radius: 18px; background: rgba(9,11,22,.9); border: 1px solid rgba(227,194,126,.35); box-shadow: 0 20px 60px rgba(0,0,0,.6); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); opacity: 0; pointer-events: none; transition: opacity .35s, transform .35s; z-index: 3; }
#gk .card.show { opacity: 1; transform: translate(-50%, 0); pointer-events: auto; }
#gk .card .kk { font: 600 10.5px var(--f-ui, Manrope); letter-spacing: .16em; text-transform: uppercase; color: #8e93a3; }
#gk .card h3 { margin: 2px 0 6px; font: 600 34px var(--f-name, Georgia, serif); line-height: 1.05; }
#gk .card ul { margin: 8px 0; padding-left: 18px; }
#gk .card li { margin: 6px 0; font: italic 500 17.5px var(--f-name, Georgia, serif); line-height: 1.32; color: #ddd6c6; }
#gk .card .st { font: 500 12px var(--f-num, Menlo, monospace); color: #a9a597; margin: 8px 0 12px; line-height: 1.5; }
#gk .card .row { display: flex; gap: 8px; flex-wrap: wrap; }
#gk .card .ans { display: grid; gap: 8px; margin: 10px 0; }
#gk .card .ans .b { border-radius: 12px; text-align: left; padding: 11px 13px; font-size: 14px; white-space: normal; }
#gk .card .ans .b.ok { background: rgba(126,240,194,.2); border-color: #7ef0c2; }
#gk .card .ans .b.no { background: rgba(255,107,90,.18); border-color: #ff6b5a; }
#gk .badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; background: rgba(227,194,126,.16); color: #e3c27e; font: 700 11px var(--f-ui, Manrope); letter-spacing: .08em; text-transform: uppercase; animation: gkpop .6s cubic-bezier(.2,1.6,.4,1); }
@keyframes gkpop { 0% { transform: scale(.3); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
#gk .list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-top: 10px; }
#gk .list .b { border-radius: 12px; text-align: left; padding: 10px 12px; white-space: normal; display: grid; gap: 2px; }
#gk .list .b small { font: 500 11px var(--f-ui, Manrope); color: #8e93a3; }
#gk .list .b.got { border-color: rgba(126,240,194,.55); }
#gk .list .b.cur { background: rgba(227,194,126,.18); }
#gk .warp { position: absolute; inset: 0; pointer-events: none; opacity: 0; background: radial-gradient(ellipse at center, rgba(120,170,255,0) 30%, rgba(80,130,255,.28) 100%); transition: opacity .5s; }
`;

function buildDom() {
  if (!document.getElementById('gkcss')) { const st = document.createElement('style'); st.id = 'gkcss'; st.textContent = CSS; document.head.appendChild(st); }
  const el = document.createElement('div'); el.id = 'gk';
  el.innerHTML = `<canvas id="gk3"></canvas><canvas id="gkh"></canvas><div class="warp" id="gkWarp"></div>
  <svg class="cock" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
    <defs><linearGradient id="gkm" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#1a1d29"/><stop offset="1" stop-color="#05060b"/></linearGradient>
    <radialGradient id="gkv" cx="50%" cy="48%" r="75%"><stop offset="60%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".75"/></radialGradient></defs>
    <rect width="100" height="100" fill="url(#gkv)"/>
    <path d="M0,0 L9,0 L3.2,100 L0,100 Z" fill="url(#gkm)" opacity=".92"/><path d="M100,0 L91,0 L96.8,100 L100,100 Z" fill="url(#gkm)" opacity=".92"/>
    <path d="M9,0 L3.2,100" stroke="#e3c27e" stroke-opacity=".35" stroke-width=".25" fill="none"/><path d="M91,0 L96.8,100" stroke="#e3c27e" stroke-opacity=".35" stroke-width=".25" fill="none"/>
    <path d="M0,0 L100,0 L100,3 Q50,7 0,3 Z" fill="url(#gkm)" opacity=".9"/><path d="M0,3 Q50,7 100,3" stroke="#e3c27e" stroke-opacity=".3" stroke-width=".2" fill="none"/>
  </svg>
  <div class="flash" id="gkFlash"></div>
  <div class="top"><button class="b" id="gkX">✕ ${L('Çık', 'Exit')}</button><div class="tgt"><div class="k" id="gkTk"></div><div class="n" id="gkTn"></div><div class="d" id="gkTd"></div></div><button class="b" id="gkList">★ <span id="gkCnt"></span></button></div>
  <div class="msg" id="gkMsg"></div>
  <div class="hint" id="gkHint"></div>
  <div class="joy" id="gkJoy"><i></i></div>
  <div class="thr" id="gkThr"><span>${L('GAZ', 'THRUST')}</span><i></i></div>
  <button class="turbo" id="gkTurbo">TURBO</button>
  <div class="dash"><button class="b" id="gkAuto">${L('Otopilot', 'Autopilot')}</button><div class="gauge"><div class="l"><span>${L('Hız', 'Speed')}</span><span id="gkSp"></span></div><div class="bar"><i id="gkSpB"></i></div><div class="l"><span>${L('Kalkan', 'Shield')}</span><span id="gkShT"></span></div><div class="bar sh"><i id="gkSh"></i></div></div><button class="b" id="gkStop">${L('Dur', 'Stop')}</button></div>
  <div class="card" id="gkCard"></div>`;
  document.body.appendChild(el); return el;
}

/* ---------------- scene ---------------- */
function makeStarSphere(stars) {
  const grp = new THREE.Group(), R = 40000;
  const n = stars.length, g = ptsGeo(n), P = g.attributes.position.array, C = g.attributes.aCol.array, S = g.attributes.aSize.array, A = g.attributes.aA.array;
  stars.forEach((s, i) => { const v = eq2game(eqv(s[0], s[1])).multiplyScalar(R); P[i*3] = v.x; P[i*3 + 1] = v.y; P[i*3 + 2] = v.z;
    let c = s[3] || [1, 1, 1]; if (c[0] > 1.5) c = c.map(x => x/255); C[i*3] = c[0]; C[i*3 + 1] = c[1]; C[i*3 + 2] = c[2];
    S[i] = Math.max(1.6, 7.5 - s[2]*0.95); A[i] = Math.max(0.25, Math.min(1, 1.15 - s[2]*0.13)); });
  const pts = new THREE.Points(g, ptsMat(false)); pts.frustumCulled = false; grp.add(pts);
  // Milky Way: faint dust along the real galactic plane
  const ngp = eq2game(eqv(192.859, 27.128)), gc0 = eq2game(eqv(266.405, -28.936));
  const gx = gc0.clone().sub(ngp.clone().multiplyScalar(gc0.dot(ngp))).normalize(), gy = new THREE.Vector3().crossVectors(ngp, gx);
  const m = 26000, mg = ptsGeo(m), MP = mg.attributes.position.array, MC = mg.attributes.aCol.array, MS = mg.attributes.aSize.array, MA = mg.attributes.aA.array;
  const gauss = () => (Math.random() + Math.random() + Math.random() + Math.random() - 2)/2;
  for (let i = 0; i < m; i++) {
    let l = Math.random()*Math.PI*2; if (Math.random() < 0.45) l = gauss()*0.9;
    const toC = Math.cos(l)*0.5 + 0.5, b = gauss()*(0.07 + 0.12*Math.pow(toC, 4)), cb = Math.cos(b);
    const v = gx.clone().multiplyScalar(cb*Math.cos(l)).add(gy.clone().multiplyScalar(cb*Math.sin(l))).add(ngp.clone().multiplyScalar(Math.sin(b))).multiplyScalar(R*0.98);
    MP[i*3] = v.x; MP[i*3 + 1] = v.y; MP[i*3 + 2] = v.z;
    const w = Math.random(), col = w < 0.5 ? [0.75, 0.8, 1] : w < 0.85 ? [1, 0.9, 0.75] : [1, 0.6, 0.65];
    MC[i*3] = col[0]; MC[i*3 + 1] = col[1]; MC[i*3 + 2] = col[2]; MS[i] = 2 + Math.random()*5; MA[i] = 0.05 + 0.12*Math.random()*(0.5 + toC);
  }
  const mw = new THREE.Points(mg, ptsMat(false)); mw.frustumCulled = false; grp.add(mw);
  // a few soft nebula glows along the plane
  const neb = glowTex([[0, 'rgba(255,255,255,.55)'], [0.4, 'rgba(255,255,255,.14)'], [1, 'rgba(255,255,255,0)']]);
  const ncol = [0x6f8cff, 0xff7ea8, 0xffc98a, 0x8affd9, 0xb48aff];
  for (let i = 0; i < 26; i++) { const l = (i/26)*Math.PI*2 + Math.random()*0.2, b = gauss()*0.08;
    const v = gx.clone().multiplyScalar(Math.cos(b)*Math.cos(l)).add(gy.clone().multiplyScalar(Math.cos(b)*Math.sin(l))).add(ngp.clone().multiplyScalar(Math.sin(b))).multiplyScalar(R*0.97);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: neb, color: ncol[i % 5], transparent: true, opacity: 0.05 + Math.random()*0.06*(0.5 + (Math.cos(l)*0.5 + 0.5)), blending: THREE.AdditiveBlending, depthWrite: false }));
    s.position.copy(v); s.scale.setScalar(R*(0.18 + Math.random()*0.25)); grp.add(s); }
  grp.userData.mats = [pts.material, mw.material];
  return grp;
}

function starBody(r, c1, c2, scale) {
  const grp = new THREE.Group();
  const mat = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uC1: { value: new THREE.Color(c1) }, uC2: { value: new THREE.Color(c2) }, uScale: { value: scale || 4 } }, vertexShader: STARSURF.vertexShader, fragmentShader: STARSURF.fragmentShader });
  const sph = new THREE.Mesh(new THREE.SphereGeometry(r, 64, 48), mat); grp.add(sph);
  const col = new THREE.Color(c1), cs = 'rgba(' + Math.round(col.r*255) + ',' + Math.round(col.g*255) + ',' + Math.round(col.b*255) + ',';
  const g1 = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex([[0, cs + '1)'], [0.25, cs + '.55)'], [0.6, cs + '.12)'], [1, cs + '0)']]), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  g1.scale.setScalar(r*4.2); grp.add(g1);
  const g2 = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex([[0, cs + '.35)'], [0.3, cs + '.08)'], [1, cs + '0)']]), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  g2.scale.setScalar(r*14); grp.add(g2);
  grp.userData = { mat, r, glow: [g1, g2] };
  return grp;
}

function planetMesh(p, tex) {
  const grp = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(p.r, 64, 48), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, metalness: 0 }));
  grp.add(body); body.rotation.z = (p.tilt || 0)*D2R;
  if (p.id === 'Earth') { const cl = new THREE.Mesh(new THREE.SphereGeometry(p.r*1.015, 64, 48), new THREE.MeshStandardMaterial({ map: G.tex.clouds, transparent: true, depthWrite: false, roughness: 1 })); cl.rotation.z = body.rotation.z; grp.add(cl); grp.userData.clouds = cl; }
  if (p.atm) { const a = new THREE.Mesh(new THREE.SphereGeometry(p.r*1.09, 48, 32), new THREE.ShaderMaterial({ uniforms: { uC: { value: new THREE.Color().setRGB(...p.atm) }, uSun: { value: new THREE.Vector3() } }, vertexShader: ATM.vertexShader, fragmentShader: ATM.fragmentShader, side: THREE.BackSide, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    grp.add(a); grp.userData.atm = a; }
  if (p.ring) {
    const [i0, i1] = p.ring, rg = new THREE.RingGeometry(p.r*i0, p.r*i1, 160, 1), pos = rg.attributes.position, uv = rg.attributes.uv;
    for (let i = 0; i < pos.count; i++) { const d = Math.hypot(pos.getX(i), pos.getY(i)); uv.setXY(i, (d - p.r*i0)/(p.r*(i1 - i0)), 0.5); }
    const c = document.createElement('canvas'); c.width = 512; c.height = 4; const g = c.getContext('2d');
    for (let x = 0; x < 512; x++) { const t = x/512; let a = p.id === 'Saturn' ? (0.25 + 0.6*noise3(t*40, 1, 1))*(t > 0.52 && t < 0.56 ? 0.08 : 1)*sm(0, 0.05, t)*sm(1, 0.9, t) : 0.35*sm(0, 0.2, t)*sm(1, 0.8, t);
      const v = p.id === 'Saturn' ? 200 + 50*noise3(t*90, 3, 3) : 190; g.fillStyle = 'rgba(' + Math.round(v) + ',' + Math.round(v*0.92) + ',' + Math.round(v*0.78) + ',' + a.toFixed(3) + ')'; g.fillRect(x, 0, 1, 4); }
    const rt = new THREE.CanvasTexture(c); rt.encoding = THREE.sRGBEncoding;
    const ring = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ map: rt, transparent: true, side: THREE.DoubleSide, depthWrite: false, color: 0xd8d2c4 }));
    ring.rotation.x = -Math.PI/2; const tilt = new THREE.Group(); tilt.rotation.z = (p.tilt || 0)*D2R; tilt.add(ring); grp.add(tilt);
  }
  grp.userData.body = body; return grp;
}

function rockGeo(seed) {
  const g = new THREE.IcosahedronGeometry(1, 1), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 0.72 + 0.5*noise3(x*1.7 + seed, y*1.7, z*1.7); p.setXYZ(i, x*k, y*k*0.85, z*k); }
  g.computeVertexNormals(); return g;
}

function buildSolar() {
  const grp = new THREE.Group(), bodies = [];
  const sun = starBody(70, '#fff1c2', '#ff9a2e', 4.5); grp.add(sun); bodies.push({ id: 'Sun', obj: sun, r: 70, star: true });
  const date = new Date();
  PLANETS.forEach(p => {
    let v = null; try { v = G.helio(p.id, date); } catch (e) {}
    const dir = v ? ecl2game(v).normalize() : new THREE.Vector3(Math.cos(p.orbit), 0, Math.sin(p.orbit));
    const m = planetMesh(p, G.tex[p.tex]); m.position.copy(dir.multiplyScalar(p.orbit)); grp.add(m);
    bodies.push({ id: p.id, obj: m, r: p.r, p });
    // faint orbit ring
    const pts = []; for (let k = 0; k <= 256; k++) { const a = k/256*Math.PI*2; pts.push(new THREE.Vector3(Math.cos(a)*p.orbit, 0, Math.sin(a)*p.orbit)); }
    const ol = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: p.id === 'Earth' ? 0x6fb3ff : 0xe3c27e, transparent: true, opacity: p.id === 'Earth' ? 0.22 : 0.1, depthWrite: false }));
    grp.add(ol);
    if (p.id === 'Earth') { const moon = planetMesh({ id: 'Moon', r: 3.8, tilt: 0 }, G.tex.moon); moon.position.copy(m.position).add(new THREE.Vector3(46, 4, 0)); grp.add(moon); bodies.push({ id: 'Moon', obj: moon, r: 3.8, moonOf: m }); }
  });
  // asteroid belt between Mars and Jupiter
  const N = 2600, rocks = [], geo = rockGeo(3), mat = new THREE.MeshStandardMaterial({ color: 0x5e584f, roughness: 1, flatShading: true });
  const belt = new THREE.InstancedMesh(geo, mat, N), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler();
  for (let i = 0; i < N; i++) {
    const a = Math.random()*Math.PI*2, rr = 1230 + Math.pow(Math.random(), 0.8)*300, y = (Math.random() + Math.random() - 1)*35;
    const s = Math.random() < 0.03 ? 4 + Math.random()*5 : 0.5 + Math.pow(Math.random(), 2.5)*3, pos = new THREE.Vector3(Math.cos(a)*rr, y, Math.sin(a)*rr);
    E.set(Math.random()*6, Math.random()*6, Math.random()*6); Q.setFromEuler(E); M.compose(pos, Q, new THREE.Vector3(s, s*(0.6 + Math.random()*0.5), s)); belt.setMatrixAt(i, M);
    rocks.push({ pos, s });
  }
  belt.instanceMatrix.needsUpdate = true; grp.add(belt);
  // a comet on a long ellipse through the inner system
  const comet = makeComet(); grp.add(comet.grp);
  return { grp, bodies, sun, belt, rocks, comet };
}

function makeComet() {
  const grp = new THREE.Group(), n = 900, g = ptsGeo(n), mat = ptsMat(true), pts = new THREE.Points(g, mat); pts.frustumCulled = false; grp.add(pts);
  const head = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex([[0, 'rgba(220,240,255,1)'], [0.2, 'rgba(160,210,255,.6)'], [1, 'rgba(120,180,255,0)']]), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  head.scale.setScalar(26); grp.add(head);
  const seeds = new Float32Array(n*4); for (let i = 0; i < n*4; i++) seeds[i] = Math.random();
  return { grp, g, head, seeds, t: Math.random()*10, mat };
}
function updateComet(c, dt, sunPos) {
  c.t += dt*0.012;
  const a = 1500, e = 0.82, E = c.t*6.283, x = a*(Math.cos(E) - e), z = a*Math.sqrt(1 - e*e)*Math.sin(E);
  const P = new THREE.Vector3(x, Math.sin(E)*120, z).applyAxisAngle(new THREE.Vector3(0, 1, 0), 2.1);
  c.head.position.copy(P);
  const away = P.clone().sub(sunPos).normalize(), d = P.distanceTo(sunPos), L = Math.max(60, 9000/Math.max(200, d)*60);
  const pa = c.g.attributes.position.array, ca = c.g.attributes.aCol.array, sa = c.g.attributes.aSize.array, aa = c.g.attributes.aA.array, n = sa.length;
  const side = new THREE.Vector3().crossVectors(away, new THREE.Vector3(0, 1, 0)).normalize(), up = new THREE.Vector3().crossVectors(side, away);
  for (let i = 0; i < n; i++) { const s = c.seeds[i*4], u = Math.pow(s, 1.6), spread = 2 + u*L*0.16, dust = i % 3 === 0;
    const curve = dust ? u*u*L*0.25 : 0, j1 = (c.seeds[i*4 + 1] - 0.5)*spread, j2 = (c.seeds[i*4 + 2] - 0.5)*spread;
    pa[i*3] = P.x + away.x*u*L + side.x*(j1 + curve) + up.x*j2; pa[i*3 + 1] = P.y + away.y*u*L + side.y*(j1 + curve) + up.y*j2; pa[i*3 + 2] = P.z + away.z*u*L + side.z*(j1 + curve) + up.z*j2;
    const col = dust ? [1, 0.88, 0.7] : [0.6, 0.8, 1]; ca[i*3] = col[0]; ca[i*3 + 1] = col[1]; ca[i*3 + 2] = col[2]; sa[i] = 7 + c.seeds[i*4 + 3]*10; aa[i] = (1 - u)*0.5; }
  c.g.attributes.position.needsUpdate = true; c.g.attributes.aCol.needsUpdate = true; c.g.attributes.aSize.needsUpdate = true; c.g.attributes.aA.needsUpdate = true;
}

function buildSystem(id) {
  const grp = new THREE.Group(), bodies = [];
  const add = (sid, o, r, star) => { grp.add(o); bodies.push({ id: sid, obj: o, r, star, sys: id }); };
  if (id === 'AlphaCen') {
    const a = starBody(80, '#fff3cf', '#ffae4a', 4.5), b = starBody(62, '#ffd59a', '#ff7a2a', 5); b.position.set(620, 30, -200); add('AlphaCen', a, 80, true); grp.add(b);
    const px = starBody(16, '#ff8a5a', '#a82a14', 7); px.position.set(-2600, 200, 1400); grp.add(px);
    const pb = planetMesh({ id: 'Proxima b', r: 6, tilt: 10, atm: [1, 0.6, 0.4] }, G.tex.mars); pb.position.set(-2600 + 70, 205, 1400); grp.add(pb);
    grp.userData.extra = [[b, 'Alpha Centauri B'], [px, 'Proxima Centauri'], [pb, 'Proxima b']];
  } else if (id === 'Sirius') {
    const a = starBody(95, '#f4f8ff', '#9cc0ff', 4); add('Sirius', a, 95, true);
    const b = starBody(4, '#ffffff', '#cfe0ff', 6); b.position.set(520, 40, 120); grp.add(b); grp.userData.extra = [[b, 'Sirius B']];
  } else if (id === 'Vega') {
    const a = starBody(110, '#f2f6ff', '#a9c4ff', 4); add('Vega', a, 110, true);
    const n = 9000, g = ptsGeo(n), P = g.attributes.position.array, C = g.attributes.aCol.array, S = g.attributes.aSize.array, A = g.attributes.aA.array;
    for (let i = 0; i < n; i++) { const an = Math.random()*Math.PI*2, r = 700 + Math.pow(Math.random(), 0.7)*900, y = (Math.random() - 0.5)*30*(r/900);
      P[i*3] = Math.cos(an)*r; P[i*3 + 1] = y; P[i*3 + 2] = Math.sin(an)*r; const w = 0.6 + Math.random()*0.4; C[i*3] = w; C[i*3 + 1] = w*0.85; C[i*3 + 2] = w*0.7; S[i] = 10 + Math.random()*18; A[i] = 0.18 + Math.random()*0.25; }
    const disk = new THREE.Points(g, ptsMat(true)); disk.rotation.x = 0.35; disk.frustumCulled = false; grp.add(disk); grp.userData.disk = disk;
  } else if (id === 'Betelgeuse') {
    const a = starBody(900, '#ff9a5a', '#7a1606', 3); add('Betelgeuse', a, 900, true); a.userData.pulse = true;
  }
  return { grp, bodies };
}

/* ---------------- dust, meteors ---------------- */
function makeDust() {
  const n = 900, pos = new Float32Array(n*6), col = new Float32Array(n*6), g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const base = new Float32Array(n*3); for (let i = 0; i < n*3; i++) base[i] = (Math.random() - 0.5)*500;
  const line = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); line.frustumCulled = false;
  return { line, base, n };
}
function updateDust(D, cam, vel, warp) {
  const pos = D.line.geometry.attributes.position.array, col = D.line.geometry.attributes.color.array, B = 500, h = B/2;
  const sp = vel.length(), k = warp ? 0.06 : Math.min(0.35, 0.012 + sp*0.0016), cx = cam.x, cy = cam.y, cz = cam.z;
  for (let i = 0; i < D.n; i++) {
    const x = ((D.base[i*3] - cx) % B + B + h) % B - h + cx, y = ((D.base[i*3 + 1] - cy) % B + B + h) % B - h + cy, z = ((D.base[i*3 + 2] - cz) % B + B + h) % B - h + cz;
    pos[i*6] = x; pos[i*6 + 1] = y; pos[i*6 + 2] = z; pos[i*6 + 3] = x - vel.x*k; pos[i*6 + 4] = y - vel.y*k; pos[i*6 + 5] = z - vel.z*k;
    const d = Math.hypot(x - cx, y - cy, z - cz), a = Math.max(0, 1 - d/h)*(warp ? 1 : Math.min(1, 0.25 + sp/200));
    const c1 = warp ? [0.6*a, 0.75*a, a] : [0.55*a, 0.55*a, 0.6*a]; col[i*6] = c1[0]; col[i*6 + 1] = c1[1]; col[i*6 + 2] = c1[2]; col[i*6 + 3] = 0; col[i*6 + 4] = 0; col[i*6 + 5] = 0;
  }
  D.line.geometry.attributes.position.needsUpdate = true; D.line.geometry.attributes.color.needsUpdate = true;
}
function makeMeteors(scene) {
  const list = [], geo = rockGeo(7), mat = new THREE.MeshStandardMaterial({ color: 0x6d5a4a, roughness: 1, flatShading: true, emissive: 0x2a1006 });
  for (let i = 0; i < 7; i++) {
    const m = new THREE.Mesh(geo, mat), tn = 40, tg = ptsGeo(tn), trail = new THREE.Points(tg, ptsMat(true)); trail.frustumCulled = false;
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex([[0, 'rgba(255,230,190,1)'], [0.3, 'rgba(255,150,60,.5)'], [1, 'rgba(255,90,20,0)']]), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    m.visible = trail.visible = glow.visible = false; scene.add(m); scene.add(trail); scene.add(glow);
    list.push({ m, trail, glow, tg, hist: [], v: new THREE.Vector3(), life: 0, r: 1, spin: new THREE.Vector3() });
  }
  return { list, next: 2 };
}
function spawnMeteor(M, cam, fwd, right, up) {
  const o = M.list.find(x => x.life <= 0); if (!o) return;
  const d = 260 + Math.random()*420, side = Math.random() < 0.5 ? -1 : 1;
  const start = cam.clone().add(fwd.clone().multiplyScalar(d)).add(right.clone().multiplyScalar(side*(180 + Math.random()*260))).add(up.clone().multiplyScalar((Math.random() - 0.3)*220));
  const aim = cam.clone().add(fwd.clone().multiplyScalar(d*(0.3 + Math.random()*0.7))).add(right.clone().multiplyScalar(-side*(40 + Math.random()*120))).add(up.clone().multiplyScalar((Math.random() - 0.5)*80));
  o.m.position.copy(start); o.v.copy(aim.sub(start).normalize().multiplyScalar(160 + Math.random()*220)); o.life = 5; o.r = 1.2 + Math.random()*3.2; o.m.scale.setScalar(o.r);
  o.spin.set(Math.random(), Math.random(), Math.random()); o.hist = []; o.m.visible = o.trail.visible = o.glow.visible = true; o.glow.scale.setScalar(o.r*9);
}
function updateMeteors(M, dt) {
  M.list.forEach(o => {
    if (o.life <= 0) return; o.life -= dt;
    o.m.position.addScaledVector(o.v, dt); o.m.rotation.x += o.spin.x*dt*3; o.m.rotation.y += o.spin.y*dt*3; o.glow.position.copy(o.m.position);
    o.hist.unshift(o.m.position.clone()); if (o.hist.length > 40) o.hist.pop();
    const a = o.tg.attributes, n = 40, fade = Math.min(1, o.life);
    for (let i = 0; i < n; i++) { const p = o.hist[Math.min(i, o.hist.length - 1)], t = i/n; a.position.array[i*3] = p.x; a.position.array[i*3 + 1] = p.y; a.position.array[i*3 + 2] = p.z;
      a.aCol.array[i*3] = 1; a.aCol.array[i*3 + 1] = 0.75 - t*0.4; a.aCol.array[i*3 + 2] = 0.45 - t*0.35; a.aSize.array[i] = o.r*(14 - t*10); a.aA.array[i] = (1 - t)*0.55*fade*(i < o.hist.length ? 1 : 0); }
    a.position.needsUpdate = a.aCol.needsUpdate = a.aSize.needsUpdate = a.aA.needsUpdate = true;
    if (o.life <= 0) o.m.visible = o.trail.visible = o.glow.visible = false;
  });
}

/* ---------------- game ---------------- */
function init(opts) {
  const el = buildDom(), $ = id => el.querySelector('#' + id);
  const renderer = new THREE.WebGLRenderer({ canvas: $('gk3'), antialias: true, powerPreference: 'high-performance' });
  const pr = Math.min(window.devicePixelRatio || 1, 2); renderer.setPixelRatio(pr);
  renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(70, 1, 0.3, 120000);
  const ship = new THREE.Object3D(); ship.add(camera); scene.add(ship);
  G = Object.assign(G || {}, { el, $, renderer, scene, camera, ship, pr, helio: opts.helio, tex: {} });
  // textures (procedural, painted once)
  Object.keys(TEX).forEach(k => { G.tex[k] = TEX[k](); });
  const sky = makeStarSphere(opts.stars); scene.add(sky); G.sky = sky;
  scene.add(new THREE.AmbientLight(0x404a66, 0.32));
  const sunLight = new THREE.PointLight(0xfff2dd, 1.7, 0, 0); scene.add(sunLight); G.sunLight = sunLight;
  G.sol = buildSolar(); scene.add(G.sol.grp);
  G.dust = makeDust(); scene.add(G.dust.line);
  G.met = makeMeteors(scene);
  // Sun marker for other star systems: a small bright point fixed in the sky
  const sunMark = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex([[0, 'rgba(255,240,200,1)'], [0.15, 'rgba(255,220,150,.5)'], [1, 'rgba(255,200,120,0)']]), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, sizeAttenuation: false }));
  sunMark.scale.setScalar(0.035); sunMark.visible = false; scene.add(sunMark); G.sunMark = sunMark;
  Object.assign(G, { near: new Set(), mode: 'sol', sys: null, vel: new THREE.Vector3(), speed: 0, thr: 0, turbo: false, auto: false, target: 'Mars', shield: 100, shake: 0,
    steer: { x: 0, y: 0, roll: 0 }, keys: {}, warp: null, card: null, last: performance.now(), running: false, meteorT: 3, hitCD: 0, near: null, flashT: 0 });
  bindInput(); resize(); window.addEventListener('resize', resize);
  placeAtEarth();
  $('gkX').onclick = close; $('gkList').onclick = openList; $('gkAuto').onclick = () => setAuto(!G.auto);
  $('gkStop').onclick = () => { setAuto(false); setThr(0); };
  updateCount();
}
function placeAtEarth() {
  const e = G.sol.bodies.find(b => b.id === 'Earth').obj.position, out = e.clone().normalize();
  const side = new THREE.Vector3().crossVectors(out, new THREE.Vector3(0, 1, 0)).normalize();
  G.ship.position.copy(e).add(out.clone().multiplyScalar(-14*3.2)).add(side.multiplyScalar(14*2.2)).add(new THREE.Vector3(0, 9, 0));
  const m = new THREE.Matrix4().lookAt(G.ship.position, e.clone().add(new THREE.Vector3(30, 0, 0)), new THREE.Vector3(0, 1, 0)); G.ship.quaternion.setFromRotationMatrix(m);
  G.speed = 0; G.thr = 0; G.near = new Set(['Earth']);
}

function resize() {
  const w = innerWidth, h = innerHeight; G.renderer.setSize(w, h, false); G.camera.aspect = w/h; G.camera.updateProjectionMatrix();
  const hc = G.$('gkh'); hc.width = Math.round(w*G.pr); hc.height = Math.round(h*G.pr);
  G.mobile = matchMedia('(pointer: coarse)').matches || w < 700;
  G.$('gkHint').textContent = G.mobile ? L('Sol tarafı sürükleyerek yön ver · sağdaki çubuk gaz · hedef seçip Otopilot\'a da basabilirsin', 'Drag on the left to steer · the bar on the right is thrust · or pick a target and tap Autopilot')
    : L('Fare ile sürükle ya da ok tuşları: yön · W/S: gaz · Shift: turbo · Q/E: yuvarlan · Boşluk: otopilot', 'Drag with the mouse or arrow keys: steer · W/S: thrust · Shift: turbo · Q/E: roll · Space: autopilot');
}

function bindInput() {
  const c = G.$('gkh'), joy = G.$('gkJoy'), thr = G.$('gkThr'), turbo = G.$('gkTurbo');
  c.style.touchAction = 'none';
  let drag = null;
  c.addEventListener('pointerdown', e => { if (G.card && G.card.modal) return; c.setPointerCapture(e.pointerId); drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
    joy.style.display = 'block'; joy.style.left = e.clientX + 'px'; joy.style.top = e.clientY + 'px'; joy.firstChild.style.transform = ''; });
  c.addEventListener('pointermove', e => { if (!drag || drag.id !== e.pointerId) return; const R = 60, dx = Math.max(-R, Math.min(R, e.clientX - drag.x)), dy = Math.max(-R, Math.min(R, e.clientY - drag.y));
    G.steer.x = dx/R; G.steer.y = dy/R; joy.firstChild.style.transform = 'translate(' + dx + 'px,' + dy + 'px)'; if (Math.abs(dx) + Math.abs(dy) > 12) setAuto(false); });
  const up = e => { if (!drag || drag.id !== e.pointerId) return; drag = null; G.steer.x = G.steer.y = 0; joy.style.display = 'none'; };
  c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
  const thrSet = e => { const r = thr.getBoundingClientRect(); setThr(1 - (e.clientY - r.top - 4)/(r.height - 8)); };
  thr.addEventListener('pointerdown', e => { thr.setPointerCapture(e.pointerId); thrSet(e); setAuto(false); thr.dragging = true; });
  thr.addEventListener('pointermove', e => { if (thr.dragging) thrSet(e); });
  thr.addEventListener('pointerup', () => { thr.dragging = false; }); thr.addEventListener('pointercancel', () => { thr.dragging = false; });
  const tOn = v => e => { e.preventDefault(); G.turbo = v; turbo.classList.toggle('on', v); if (v) { setAuto(false); if (G.thr < 0.3) setThr(0.6); } };
  turbo.addEventListener('pointerdown', tOn(true)); turbo.addEventListener('pointerup', tOn(false)); turbo.addEventListener('pointercancel', tOn(false)); turbo.addEventListener('pointerleave', tOn(false));
  G.onKey = e => {
    if (!G.running) return; const k = e.key.toLowerCase(), down = e.type === 'keydown'; G.keys[k] = down;
    if (down && k === ' ') { e.preventDefault(); setAuto(!G.auto); }
    if (down && k === 'escape') { if (G.card) hideCard(); else close(); }
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'a', 'd', 'q', 'e'].includes(k) && down) setAuto(false);
    if (k === 'shift') { G.turbo = down; turbo.classList.toggle('on', down); if (down) setAuto(false); }
  };
  window.addEventListener('keydown', G.onKey); window.addEventListener('keyup', G.onKey);
}
function setThr(v) { G.thr = Math.max(0, Math.min(1, v)); G.$('gkThr').lastChild.style.height = 'calc(' + (G.thr*100).toFixed(1) + '% - 8px)'; if (G.thr < 0.01) G.$('gkThr').lastChild.style.height = '0'; }
function setAuto(v) { if (v && !G.target) { openList(); return; } G.auto = v; G.$('gkAuto').classList.toggle('on', v); if (v) { hideCard(); hint(''); } }
function hint(t) { const h = G.$('gkHint'); if (t) h.textContent = t; h.style.opacity = t === '' ? 0 : 1; clearTimeout(G.hintT); if (t !== '') G.hintT = setTimeout(() => h.style.opacity = 0, 9000); }
function bigMsg(t, sub, ms) { const m = G.$('gkMsg'); m.innerHTML = t + (sub ? '<small>' + sub + '</small>' : ''); m.style.opacity = 1; clearTimeout(G.msgT); G.msgT = setTimeout(() => m.style.opacity = 0, ms || 1800); }
function flash(col, a) { const f = G.$('gkFlash'); f.style.transition = 'none'; f.style.background = col; f.style.opacity = a; requestAnimationFrame(() => { f.style.transition = 'opacity .6s'; f.style.opacity = 0; }); }
function updateCount() { G.$('gkCnt').textContent = Object.keys(PROG.found).length + '/' + ORDER.length; }

function bodyById(id) { return (G.mode === 'sol' ? G.sol.bodies : G.sys.bodies).find(b => b.id === id); }
function worldPos(b) { return b.obj.getWorldPosition(new THREE.Vector3()); }
function isStarDest(id) { return !!STARSYS[id]; }

function setTarget(id) {
  G.target = id; hideCard(); updateTargetHud();
  if (isStarDest(id) && G.mode !== id) { hint(L('Hiper sürüş hazır: Otopilot\'a bas, mekik yıldıza dönüp ışık hızını aşacak.', 'Hyperdrive ready: tap Autopilot, the shuttle will turn to the star and jump.')); }
  else if (!isStarDest(id) && G.mode !== 'sol') hint(L('Otopilot seni Güneş Sistemi\'ne geri götürür.', 'Autopilot will take you back to the Solar System.'));
  else hint(L('Otopilot\'a bas ya da kendin sür: hedef işaretli.', 'Tap Autopilot or fly yourself: the target is marked.'));
}
function updateTargetHud() {
  const id = G.target; G.$('gkTk').textContent = id ? L('Hedef', 'Target') + ' · ' + tx2(INFO[id].k) : ''; G.$('gkTn').textContent = id ? nm(id) : '';
}

function openList() {
  const items = ORDER.map(id => '<button class="b' + (PROG.found[id] ? ' got' : '') + (G.target === id ? ' cur' : '') + '" data-id="' + id + '"><b>' + (PROG.found[id] ? '★ ' : '') + nm(id) + '</b><small>' + tx2(INFO[id].k) + (PROG.quiz[id] ? ' · ✓' : '') + '</small></button>').join('');
  showCard('<div class="kk">' + L('Görev listesi', 'Mission list') + ' · ' + Object.keys(PROG.found).length + '/' + ORDER.length + ' ' + L('keşif', 'discovered') + ' · ' + Object.keys(PROG.quiz).length + ' ' + L('doğru cevap', 'correct answers') + '</div><h3>' + L('Nereye gidelim?', 'Where to?') + '</h3>' +
    '<div class="st">' + L('Gezegenler bu anki gerçek konumlarında. Yıldızlara hiper sürüşle gidilir.', 'Planets are in their real positions right now. Stars are reached by hyperdrive.') + '</div><div class="list">' + items + '</div><div class="row" style="margin-top:12px"><button class="b" data-close>' + L('Kapat', 'Close') + '</button></div>', true);
  G.$('gkCard').querySelectorAll('[data-id]').forEach(b => b.onclick = () => { setTarget(b.dataset.id); setAuto(true); });
}
function showCard(html, modal) { const c = G.$('gkCard'); c.innerHTML = html; c.classList.add('show'); G.card = { modal }; const x = c.querySelector('[data-close]'); if (x) x.onclick = hideCard; }
function hideCard() { G.$('gkCard').classList.remove('show'); G.card = null; }

function discover(id, viaTarget) {
  const first = !PROG.found[id]; if (first) { PROG.found[id] = Date.now(); save(); updateCount(); }
  const I = INFO[id];
  let real = '';
  if (!isStarDest(id) && id !== 'Earth') {
    try { const n = id === 'Moon' ? null : id === 'Sun' ? null : id; const now = new Date();
      if (id === 'Moon') real = L('Işığın Ay\'dan Dünya\'ya gelmesi 1,3 saniye sürer.', 'Light takes 1.3 seconds to travel from the Moon to Earth.');
      else { const e = G.helio('Earth', now), p = n ? G.helio(n, now) : [0, 0, 0], d = Math.hypot(p[0] - e[0], p[1] - e[1], p[2] - e[2]), km = d*149.6, lm = d*8.317;
        real = L('Bugün Dünya\'dan uzaklığı: ', 'Distance from Earth today: ') + (km >= 1000 ? (km/1000).toLocaleString(LANG === 'en' ? 'en' : 'tr', { maximumFractionDigits: 2 }) + L(' milyar km', ' billion km') : Math.round(km).toLocaleString(LANG === 'en' ? 'en' : 'tr') + L(' milyon km', ' million km')) +
          ' · ' + L('ışık bu yolu ', 'light covers it in ') + (lm >= 60 ? (lm/60).toLocaleString(LANG === 'en' ? 'en' : 'tr', { maximumFractionDigits: 1 }) + L(' saatte alır', ' hours') : Math.round(lm) + L(' dakikada alır', ' minutes')); } } catch (e) {}
  } else if (isStarDest(id)) { const ly = STARSYS[id].ly; real = L('Işık bile buraya ', 'Even light needs ') + ly.toLocaleString(LANG === 'en' ? 'en' : 'tr') + L(' yılda ulaşır. Gökyüzündeki parlak nokta: Güneş.', ' years to get here. The bright dot in the sky behind you: the Sun.'); }
  const html = '<div class="kk">' + tx2(I.k) + '</div><h3>' + nm(id) + '</h3>' + (first ? '<span class="badge">★ ' + L('Yeni keşif', 'New discovery') + '</span>' : '<span class="badge" style="animation:none;opacity:.7">' + L('Daha önce keşfedildi', 'Discovered before') + '</span>') +
    '<ul>' + I.f.map(f => '<li>' + tx2(f) + '</li>').join('') + '</ul><div class="st">' + tx2(I.s) + (real ? '<br>' + real : '') + '</div>' +
    '<div class="row">' + (PROG.quiz[id] ? '' : '<button class="b on" id="gkQ">' + L('Soruyu cevapla', 'Answer the question') + '</button>') + '<button class="b" id="gkNext">' + L('Sonraki hedef', 'Next target') + '</button><button class="b" data-close>' + L('Etrafa bak', 'Look around') + '</button></div>';
  showCard(html, false);
  if (first) { bigMsg(L('Keşfedildi!', 'Discovered!'), nm(id), 1700); flash('radial-gradient(circle, rgba(227,194,126,.35), rgba(227,194,126,0) 70%)', 1); }
  const q = G.$('gkQ'); if (q) q.onclick = () => quiz(id);
  G.$('gkNext').onclick = () => { const nx = ORDER.find(x => !PROG.found[x]) || ORDER[(ORDER.indexOf(id) + 1) % ORDER.length]; setTarget(nx); setAuto(true); };
}
function quiz(id) {
  const I = INFO[id], ans = I.a.map((a, i) => ({ a, ok: i === 0 })).sort(() => Math.random() - 0.5);
  showCard('<div class="kk">' + L('Soru', 'Question') + ' · ' + nm(id) + '</div><h3 style="font-size:26px">' + tx2(I.q) + '</h3><div class="ans">' + ans.map((x, i) => '<button class="b" data-i="' + i + '">' + tx2(x.a) + '</button>').join('') + '</div><div class="row"><button class="b" data-close>' + L('Kapat', 'Close') + '</button></div>', true);
  G.$('gkCard').querySelectorAll('[data-i]').forEach(b => b.onclick = () => {
    const x = ans[+b.dataset.i]; G.$('gkCard').querySelectorAll('[data-i]').forEach((bb, i) => { bb.disabled = true; if (ans[i].ok) bb.classList.add('ok'); });
    if (x.ok) { b.classList.add('ok'); PROG.quiz[id] = 1; save(); bigMsg(L('Doğru!', 'Correct!'), '+1 ★', 1400); }
    else { b.classList.add('no'); bigMsg(L('Olmadı', 'Not quite'), L('Doğrusu yeşil olan', 'The right one is in green'), 1600); }
    const row = G.$('gkCard').querySelector('.row'); row.insertAdjacentHTML('afterbegin', '<button class="b on" id="gkNext2">' + L('Sonraki hedef', 'Next target') + '</button>');
    G.$('gkNext2').onclick = () => { const nx = ORDER.find(y => !PROG.found[y]) || ORDER[(ORDER.indexOf(id) + 1) % ORDER.length]; setTarget(nx); setAuto(true); };
  });
}

/* hyperdrive: turn to the star, stretch the stars into streaks, flash, arrive */
function startWarp(to) {
  const fromSys = G.mode;
  G.warp = { t: 0, to, fromSys, swapped: false };
  G.$('gkWarp').style.opacity = 1; hideCard();
  const ly = to === 'sol' ? (STARSYS[fromSys] ? STARSYS[fromSys].ly : 0) : STARSYS[to].ly;
  bigMsg(L('Hiper sürüş', 'Hyperdrive'), ly.toLocaleString(LANG === 'en' ? 'en' : 'tr') + L(' ışık yılı · ışık hızıyla ', ' light-years · at light speed ') + ly.toLocaleString(LANG === 'en' ? 'en' : 'tr') + L(' yıl sürerdi', ' years'), 2600);
}
function swapScene(to) {
  if (G.sys) { G.scene.remove(G.sys.grp); G.sys = null; }
  if (to === 'sol') {
    G.sol.grp.visible = true; G.sunLight.position.set(0, 0, 0); G.sunMark.visible = false; G.mode = 'sol';
    const e = G.sol.bodies.find(b => b.id === 'Sun'); G.ship.position.set(0, 200, 0).add(eq2game(eqv(STARSYS[G.warp.fromSys].ra, STARSYS[G.warp.fromSys].dec)).multiplyScalar(600));
    const m = new THREE.Matrix4().lookAt(G.ship.position, e.obj.position, new THREE.Vector3(0, 1, 0)); G.ship.quaternion.setFromRotationMatrix(m);
  } else {
    G.sol.grp.visible = false; G.sys = buildSystem(to); G.scene.add(G.sys.grp); G.mode = to; G.sunLight.position.set(0, 0, 0);
    const dir = eq2game(eqv(STARSYS[to].ra, STARSYS[to].dec)), main = G.sys.bodies[0];
    G.ship.position.copy(dir.clone().multiplyScalar(-main.r*9)).add(new THREE.Vector3(0, main.r*1.5, 0));
    const m = new THREE.Matrix4().lookAt(G.ship.position, new THREE.Vector3(), new THREE.Vector3(0, 1, 0)); G.ship.quaternion.setFromRotationMatrix(m);
    G.sunDir = dir.clone().negate(); G.sunMark.visible = true;
  }
}

function frame(t) {
  if (!G.running) return; requestAnimationFrame(frame);
  const dt = Math.min(0.05, (t - G.last)/1000); G.last = t; G.time = (G.time || 0) + dt;
  const ship = G.ship, q = ship.quaternion;
  const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(q), right = new THREE.Vector3(1, 0, 0).applyQuaternion(q), up = new THREE.Vector3(0, 1, 0).applyQuaternion(q);
  const K = G.keys;
  // steering
  if (!G.warp) {
    let yaw = -G.steer.x, pitch = -G.steer.y, roll = 0;
    if (K.arrowleft || K.a) yaw += 1; if (K.arrowright || K.d) yaw -= 1; if (K.arrowup) pitch += 1; if (K.arrowdown) pitch -= 1; if (K.q) roll += 1; if (K.e) roll -= 1;
    if (K.w) setThr(G.thr + dt*0.8); if (K.s) setThr(G.thr - dt*0.8);
    const rate = 1.1; ship.rotateY(yaw*rate*dt); ship.rotateX(pitch*rate*dt); ship.rotateZ(roll*1.6*dt);
  }
  // autopilot / speed
  const bodies = G.mode === 'sol' ? G.sol.bodies : G.sys.bodies;
  let want = G.thr*90 + (G.turbo ? 420 : 0);
  const tb = G.target ? bodyById(G.target) : null;
  if (G.auto && !G.warp) {
    const needWarp = isStarDest(G.target) ? G.mode !== G.target : G.mode !== 'sol';
    let aimPos;
    if (needWarp) { const dirTo = G.mode === 'sol' ? eq2game(eqv(STARSYS[G.target].ra, STARSYS[G.target].dec)) : G.sunDir.clone(); aimPos = ship.position.clone().add(dirTo.multiplyScalar(10000)); }
    else aimPos = worldPos(tb);
    const m = new THREE.Matrix4().lookAt(ship.position, aimPos, up), qt = new THREE.Quaternion().setFromRotationMatrix(m), ang = q.angleTo(qt);
    q.rotateTowards(qt, dt*(0.9 + ang*0.6));
    if (needWarp) { want = ang < 0.12 ? 60 : 0; if (ang < 0.05) startWarp(G.mode === 'sol' ? G.target : 'sol'); }
    else { const d = ship.position.distanceTo(aimPos) - tb.r*(tb.star ? 4 : tb.p && tb.p.ring ? 4.6 : 3.4) - 8; want = ang > 0.6 ? 15 : Math.max(0, Math.min(520, Math.sqrt(Math.max(0, d)*2*260)));
      if (d < 6) { setAuto(false); setThr(0); want = 0; G.speed *= 0.3; } }
  }
  if (G.warp) {
    G.warp.t += dt; const w = G.warp, T = w.t;
    want = T < 2.2 ? 6000 : 0; G.speed += (want - G.speed)*Math.min(1, dt*(T < 2.2 ? 1.6 : 6));
    G.camera.fov = 70 + 35*Math.sin(Math.min(1, T/2.6)*Math.PI); G.camera.updateProjectionMatrix();
    G.shake = Math.max(G.shake, T < 2.2 ? 0.5 : 0.1);
    if (T > 2.2 && !w.swapped) { w.swapped = true; flash('#e8f0ff', 0.95); swapScene(w.to); G.speed = 900; }
    if (T > 3.2) { G.warp = null; G.$('gkWarp').style.opacity = 0; G.camera.fov = 70; G.camera.updateProjectionMatrix(); G.speed = 120; G.auto = true; G.$('gkAuto').classList.add('on');
      if (G.mode !== 'sol' && G.target === G.mode) {} }
  } else G.speed += (want - G.speed)*Math.min(1, dt*(want < G.speed ? 2.2 : 1.1));
  const vel = fwd.clone().multiplyScalar(G.speed); G.vel.copy(vel);
  ship.position.addScaledVector(vel, dt);
  // keep out of solid bodies
  bodies.forEach(b => { const p = worldPos(b), d = ship.position.distanceTo(p), lim = b.r*(b.star ? 1.6 : 1.12); if (d < lim) { ship.position.copy(p.clone().add(ship.position.clone().sub(p).normalize().multiplyScalar(lim))); G.speed *= 0.5; } });
  // animate
  const sunMat = G.mode === 'sol' ? G.sol.sun.userData.mat : (G.sys.bodies[0].obj.userData.mat); sunMat.uniforms.uT.value = G.time;
  if (G.mode === 'sol') {
    G.sol.bodies.forEach(b => { if (b.p) { b.obj.userData.body.rotation.y += dt*0.25/(b.p.day || 1)*0.4; if (b.obj.userData.clouds) b.obj.userData.clouds.rotation.y += dt*0.012;
      if (b.obj.userData.atm) b.obj.userData.atm.material.uniforms.uSun.value.copy(b.obj.position).negate().normalize(); } });
    G.sol.belt.rotation.y += dt*0.004;
    updateComet(G.sol.comet, dt, new THREE.Vector3());
    // belt collisions
    if (G.hitCD > 0) G.hitCD -= dt;
    const rp = ship.position.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -G.sol.belt.rotation.y), rr = Math.hypot(rp.x, rp.z);
    if (rr > 1200 && rr < 1560 && Math.abs(rp.y) < 60 && G.hitCD <= 0) {
      for (const k of G.sol.rocks) { if (Math.abs(k.pos.x - rp.x) > 20 || Math.abs(k.pos.z - rp.z) > 20) continue; if (k.pos.distanceTo(rp) < k.s + 2.5) { hit(18); break; } }
    }
  } else {
    G.sys.grp.children.forEach(o => { if (o.userData && o.userData.mat) o.userData.mat.uniforms.uT.value = G.time; });
    const main = G.sys.bodies[0].obj; if (main.userData.pulse) { const s = 1 + 0.03*Math.sin(G.time*0.7); main.scale.setScalar(s); }
    if (G.sys.grp.userData.disk) G.sys.grp.userData.disk.rotation.y += dt*0.01;
    G.sunMark.position.copy(ship.position).add(G.sunDir.clone().multiplyScalar(30000));
  }
  // meteors
  G.meteorT -= dt; if (G.meteorT <= 0 && !G.warp) { spawnMeteor(G.met, ship.position, fwd, right, up); G.meteorT = 1.6 + Math.random()*3.5; if (Math.random() < 0.25) G.meteorT = 0.25; }
  updateMeteors(G.met, dt);
  G.met.list.forEach(o => { if (o.life > 0 && o.m.position.distanceTo(ship.position) < o.r + 3 && G.hitCD <= 0) { hit(12); o.life = 0.01; }
    else if (o.life > 0 && o.m.position.distanceTo(ship.position) < o.r + 30) G.shake = Math.max(G.shake, 0.35); });
  updateDust(G.dust, ship.position, G.warp ? vel.clone().multiplyScalar(0.5) : vel, !!G.warp);
  G.sky.position.copy(ship.position);
  G.sky.userData.mats.forEach(m => { m.uniforms.uPx.value = G.pr; });
  const att = innerHeight*G.pr/(2*Math.tan(G.camera.fov*D2R/2));
  [G.sol.comet.mat].concat(G.met.list.map(o => o.trail.material)).forEach(m => { m.uniforms.uAtt.value = att; m.uniforms.uPx.value = G.pr; });
  if (G.sys && G.sys.grp.userData.disk) G.sys.grp.userData.disk.material.uniforms.uAtt.value = att;
  // shield regen, shake
  G.shield = Math.min(100, G.shield + dt*4);
  G.shake = Math.max(0, G.shake - dt*1.4) ; const sk = G.shake*G.shake;
  G.camera.position.set((Math.random() - 0.5)*sk*1.2, (Math.random() - 0.5)*sk*1.2, 0); G.camera.rotation.z = (Math.random() - 0.5)*sk*0.02;
  if (G.speed > 300 && !G.warp) G.shake = Math.max(G.shake, 0.22);
  // discoveries by proximity
  // each body triggers once per visit; a body passed while another card is open is logged quietly
  if (!G.warp) bodies.forEach(b => { const d = worldPos(b).distanceTo(ship.position) - b.r; const lim = b.r*(b.star ? 3.2 : 3.8) + 18;
    if (d < lim && !G.near.has(b.id)) { const isT = G.target === b.id;
      if (G.card && !isT) { G.near.add(b.id); if (!PROG.found[b.id]) { PROG.found[b.id] = Date.now(); save(); updateCount(); hint('★ ' + nm(b.id) + L(' keşfedildi', ' discovered')); } }
      else if (!G.card || !G.card.modal || isT) { G.near.add(b.id); discover(b.id); if (isT) setThr(0); } }
    else if (G.near.has(b.id) && d > lim*2.5) G.near.delete(b.id); });
  G.renderer.render(G.scene, G.camera);
  drawHud(bodies, tb);
}
function hit(dmg) {
  G.hitCD = 0.8; G.shield = Math.max(0, G.shield - dmg); G.shake = 1.2; G.speed *= 0.35; flash('radial-gradient(circle, rgba(255,80,60,0) 40%, rgba(255,60,40,.55))', 1);
  if (G.shield <= 0) { bigMsg(L('Kalkan tükendi!', 'Shield down!'), L('Mekik güvenli bölgeye çekildi', 'Shuttle pulled back to safety'), 2200); G.shield = 60; G.ship.position.y += 140; }
  else hint(L('Çarpışma! Kalkan %', 'Impact! Shield ') + Math.round(G.shield) + (LANG === 'en' ? '%' : ''));
}

const fmtD = d => d < 1000 ? Math.round(d).toString() : (d/1000).toFixed(1) + 'k';
function drawHud(bodies, tb) {
  const c = G.$('gkh'), g = c.getContext('2d'), W = innerWidth, H = innerHeight; g.setTransform(G.pr, 0, 0, G.pr, 0, 0); g.clearRect(0, 0, W, H);
  const cam = G.camera, v = new THREE.Vector3();
  const proj = p => { v.copy(p).project(cam); const behind = v.z > 1; return { x: (v.x*0.5 + 0.5)*W, y: (-v.y*0.5 + 0.5)*H, behind, on: !behind && Math.abs(v.x) < 1 && Math.abs(v.y) < 1 }; };
  // reticle
  g.strokeStyle = 'rgba(227,194,126,.55)'; g.lineWidth = 1.2; g.beginPath(); g.arc(W/2, H/2, 14, 0, Math.PI*2); g.moveTo(W/2 - 26, H/2); g.lineTo(W/2 - 18, H/2); g.moveTo(W/2 + 18, H/2); g.lineTo(W/2 + 26, H/2); g.moveTo(W/2, H/2 + 18); g.lineTo(W/2, H/2 + 24); g.stroke();
  g.font = '600 12px Manrope, sans-serif'; g.textAlign = 'left';
  const labels = bodies.map(b => ({ id: b.id, p: worldPos(b), r: b.r }));
  if (G.sys && G.sys.grp.userData.extra) G.sys.grp.userData.extra.forEach(([o, n]) => labels.push({ name: n, p: o.getWorldPosition(new THREE.Vector3()), r: 10 }));
  labels.forEach(o => {
    const s = proj(o.p); if (!s.on) return; const d = o.p.distanceTo(G.ship.position); const isT = o.id && o.id === G.target;
    const pxr = o.r/Math.max(1, d)*H/(2*Math.tan(cam.fov*D2R/2)), r = Math.max(10, pxr + 6);
    g.strokeStyle = isT ? 'rgba(227,194,126,.95)' : 'rgba(200,210,235,.45)'; g.lineWidth = isT ? 1.6 : 1;
    for (let k = 0; k < 4; k++) { const a = k*Math.PI/2 + Math.PI/4, cx = s.x + Math.cos(a)*r, cy = s.y + Math.sin(a)*r, sx = Math.cos(a) > 0 ? -1 : 1, sy = Math.sin(a) > 0 ? -1 : 1;
      g.beginPath(); g.moveTo(cx, cy + sy*6); g.lineTo(cx, cy); g.lineTo(cx + sx*6, cy); g.stroke(); }
    g.fillStyle = isT ? '#e3c27e' : 'rgba(225,228,240,.75)'; g.font = isT ? 'italic 600 17px "Cormorant Garamond", Georgia, serif' : '600 11.5px Manrope, sans-serif';
    g.fillText((o.id ? nm(o.id) : o.name) + (PROG.found[o.id] ? ' ★' : ''), s.x + r*0.75 + 6, s.y - r*0.75 - 2);
  });
  // Sun marker label from other systems
  if (G.mode !== 'sol' && G.sunMark.visible) { const s = proj(G.sunMark.position); if (s.on) { g.fillStyle = '#ffe9b0'; g.font = '600 12px Manrope, sans-serif'; g.fillText(L('Güneş · ', 'Sun · ') + STARSYS[G.mode].ly.toLocaleString(LANG === 'en' ? 'en' : 'tr') + L(' ışık yılı', ' ly'), s.x + 10, s.y - 8); } }
  // target: distance + edge arrow
  let dTxt = '';
  if (G.target) {
    let tp = null, warpTxt = '';
    if (isStarDest(G.target) && G.mode !== G.target) { tp = G.ship.position.clone().add(eq2game(eqv(STARSYS[G.target].ra, STARSYS[G.target].dec)).multiplyScalar(30000)); warpTxt = STARSYS[G.target].ly.toLocaleString(LANG === 'en' ? 'en' : 'tr') + L(' ışık yılı · hiper sürüş gerekir', ' light-years · needs hyperdrive'); }
    else if (!isStarDest(G.target) && G.mode !== 'sol') { tp = G.ship.position.clone().add(G.sunDir.clone().multiplyScalar(30000)); warpTxt = L('Güneş Sistemi · hiper sürüş gerekir', 'Solar System · needs hyperdrive'); }
    else if (tb) { tp = worldPos(tb); const d = Math.max(0, tp.distanceTo(G.ship.position) - tb.r); dTxt = (G.speed > 5 ? L('Varış ~', 'ETA ~') + Math.max(1, Math.round(d/Math.max(G.speed, 1))) + L(' sn', ' s') + ' · ' : '') + fmtD(d) + L(' birim', ' units'); }
    if (warpTxt) dTxt = warpTxt;
    if (tp) { const s = proj(tp);
      if (!s.on) { let dx = s.x - W/2, dy = s.y - H/2; if (s.behind) { dx = -dx; dy = -dy; } const a = Math.atan2(dy, dx), R = Math.min(W, H)*0.38, ex = W/2 + Math.cos(a)*R, ey = H/2 + Math.sin(a)*R;
        g.save(); g.translate(ex, ey); g.rotate(a); g.fillStyle = 'rgba(227,194,126,.9)'; g.beginPath(); g.moveTo(16, 0); g.lineTo(-6, -10); g.lineTo(-2, 0); g.lineTo(-6, 10); g.closePath(); g.fill(); g.restore();
        g.fillStyle = '#e3c27e'; g.font = '600 11px Manrope, sans-serif'; g.textAlign = 'center'; g.fillText(nm(G.target), ex - Math.cos(a)*26, ey - Math.sin(a)*26 + 4); g.textAlign = 'left'; }
      else if (isStarDest(G.target) && G.mode !== G.target) { g.strokeStyle = 'rgba(227,194,126,.9)'; g.lineWidth = 1.4; g.beginPath(); g.arc(s.x, s.y, 14, 0, Math.PI*2); g.stroke(); g.fillStyle = '#e3c27e'; g.font = 'italic 600 17px "Cormorant Garamond", Georgia, serif'; g.fillText(nm(G.target), s.x + 18, s.y - 10); }
    }
  }
  G.$('gkTd').textContent = dTxt;
  const spMax = 520, sp = Math.min(1, G.speed/spMax); G.$('gkSpB').style.width = (sp*100).toFixed(1) + '%';
  G.$('gkSp').textContent = G.warp ? L('IŞIK HIZI ÜSTÜ', 'FASTER THAN LIGHT') : Math.round(G.speed*0.6) + L(' × ışık', ' × light');
  G.$('gkSh').style.width = G.shield.toFixed(0) + '%'; G.$('gkShT').textContent = Math.round(G.shield) + '%';
}

/* ---------------- open / close ---------------- */
function open(opts) {
  LANG = opts.lang === 'en' ? 'en' : 'tr'; THREE = window.THREE;
  if (!G || !G.el) init(opts); else G.el.hidden = false;
  G.onClose = opts.onClose; G.running = true; G.last = performance.now(); requestAnimationFrame(frame);
  if (!PROG.seen) intro(); else { setTarget(G.target || 'Mars'); }
}
function intro() {
  showCard('<div class="kk">' + L('Uzay mekiği', 'Space shuttle') + '</div><h3>' + L('Kalkışa hazır mısın?', 'Ready for launch?') + '</h3>' +
    '<ul><li>' + L('Dünya yörüngesindesin. Gezegenler şu anki gerçek konumlarında.', 'You are in Earth orbit. The planets are where they really are right now.') + '</li>' +
    '<li>' + L('Bir hedef seç, Otopilot seni götürsün; ya da direksiyona kendin geç.', 'Pick a target and let the autopilot fly, or take the controls yourself.') + '</li>' +
    '<li>' + L('Her varışta bir keşif kartı, bir rozet ve bir soru seni bekliyor. Asteroit ve meteorlara dikkat!', 'Every arrival brings a discovery card, a badge and a question. Watch out for asteroids and meteors!') + '</li></ul>' +
    '<div class="row"><button class="b on" id="gkGo">' + L('Kalkış!', 'Launch!') + '</button></div>', true);
  G.$('gkGo').onclick = () => { PROG.seen = true; save(); hideCard(); let n = 3; const tick = () => { if (n > 0) { bigMsg(String(n), '', 800); n--; setTimeout(tick, 850); } else { bigMsg(L('Kalkış!', 'Liftoff!'), '', 1200); setThr(0.45); G.shake = 1; setTarget('Moon'); } }; tick(); };
}
function close() {
  G.running = false; G.el.hidden = true; hideCard(); setAuto(false); G.turbo = false; G.keys = {};
  if (G.onClose) G.onClose();
}
window.GKGame = { open };
})();
