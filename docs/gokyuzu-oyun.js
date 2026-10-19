/* Gökyüzü Atlası · Uzay mekiği
   Fly a shuttle through the Solar System and jump to nearby stars; every arrival earns a badge and a small
   label that opens a discovery card. Needs three.js (r149, UMD) loaded before GKGame.open() is called. */
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
// cards: name, kind, three facts, real numbers; q/a hold a question per stop (first answer right), not asked in flight
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
  ISS: { n: ['ISS', 'ISS'], k: ['Uzay istasyonu', 'Space station'],
    f: [['Uluslararası Uzay İstasyonu, yaklaşık 400 km yükseklikte Dünya\'nın etrafında döner.', 'The International Space Station circles Earth about 400 km up.'],
        ['Dünya\'nın çevresini yaklaşık 90 dakikada dolanır; içindekiler günde 16 kez gün doğumu görür.', 'It goes around Earth in about 90 minutes, so its crew sees 16 sunrises a day.'],
        ['Kasım 2000\'den beri hiç boş kalmadı; bir futbol sahası büyüklüğündedir ve geceleri çıplak gözle görülür.', 'It has been lived in non-stop since November 2000; it is as big as a football field and visible to the naked eye at night.']],
    s: ['Yükseklik: ~400 km · Hız: ~28.000 km/sa · Kütle: ~420 ton', 'Altitude: ~400 km · Speed: ~28,000 km/h · Mass: ~420 tonnes'] },
  Tiangong: { n: ['Tiangong', 'Tiangong'], k: ['Uzay istasyonu', 'Space station'],
    f: [['Çin\'in uzay istasyonu; 2022\'de tamamlandı.', 'China\'s space station, completed in 2022.'],
        ['T biçiminde üç modülden oluşur: Tianhe, Wentian ve Mengtian.', 'It is a T made of three modules: Tianhe, Wentian and Mengtian.'],
        ['Genellikle üç astronot altı aylık görevlerle yaşar.', 'Usually three astronauts live aboard on six-month missions.']],
    s: ['Yükseklik: ~390 km · Kütle: ~100 ton', 'Altitude: ~390 km · Mass: ~100 tonnes'] },
  Hubble: { n: ['Hubble', 'Hubble'], k: ['Uzay teleskobu', 'Space telescope'],
    f: [['1990\'dan beri yaklaşık 540 km yükseklikte Dünya\'nın etrafında dönüyor.', 'Circling Earth about 540 km up since 1990.'],
        ['Uzay mekikleri ona beş kez gidip astronotlar uzay yürüyüşleriyle onardı.', 'Space shuttles visited it five times; astronauts repaired it on spacewalks.'],
        ['Evrenin genişleme hızını ölçmeye ve yaşını (~13,8 milyar yıl) belirlemeye yardım etti.', 'It helped measure how fast the universe expands and pin down its age (~13.8 billion years).']],
    s: ['Ayna: 2,4 m · Boy: 13,2 m · Kütle: ~11 ton', 'Mirror: 2.4 m · Length: 13.2 m · Mass: ~11 tonnes'] },
  JWST: { n: ['James Webb', 'James Webb'], k: ['Uzay teleskobu', 'Space telescope'],
    f: [['Dünya\'dan 1,5 milyon km ötede, Güneş\'in tam tersi yönündeki L2 noktasında durur.', 'It sits 1.5 million km from Earth at the L2 point, directly away from the Sun.'],
        ['Altın kaplı 18 altıgen parçadan oluşan aynası 6,5 m genişliğindedir.', 'Its gold-coated mirror of 18 hexagonal segments is 6.5 m across.'],
        ['Tenis kortu büyüklüğündeki beş katlı güneşliği teleskobu −230 °C\'de tutar; kızılötesinde ilk galaksileri görür.', 'A tennis-court-sized, five-layer sunshield keeps it at −230 °C so it can see the first galaxies in infrared.']],
    s: ['Fırlatma: 25 Aralık 2021 · Ayna: 6,5 m', 'Launched: 25 December 2021 · Mirror: 6.5 m'] },
  Parker: { n: ['Parker Solar Probe', 'Parker Solar Probe'], k: ['Güneş sondası', 'Solar probe'],
    f: [['Güneş\'e en çok yaklaşan araç: yüzeyden yaklaşık 6,1 milyon km\'ye kadar iner.', 'The closest any craft has come to the Sun: about 6.1 million km from its surface.'],
        ['Saatte yaklaşık 690.000 km ile insan yapımı en hızlı nesne.', 'At about 690,000 km/h it is the fastest object humans have built.'],
        ['Önündeki 11 cm kalınlığındaki ısı kalkanı 1.400 °C\'ye dayanır; arkasındaki cihazlar oda sıcaklığında kalır.', 'Its 11 cm heat shield takes 1,400 °C while the instruments behind it stay near room temperature.']],
    s: ['Fırlatma: 2018 · Güneş\'in koronasından geçen ilk araç (2021)', 'Launched: 2018 · First craft to fly through the Sun\'s corona (2021)'] },
  Voyager1: { n: ['Voyager 1', 'Voyager 1'], k: ['Uzay sondası', 'Space probe'],
    f: [['İnsan yapımı en uzak nesne: Güneş\'ten 165 AU\'dan fazla, yani 25 milyar km\'den uzakta.', 'The most distant human-made object: more than 165 AU, over 25 billion km, from the Sun.'],
        ['2012\'de yıldızlararası uzaya geçen ilk araç oldu.', 'In 2012 it became the first craft to reach interstellar space.'],
        ['Üzerinde Dünya\'nın seslerini ve müziklerini taşıyan altın bir plak var.', 'It carries a golden record with the sounds and music of Earth.']],
    s: ['Fırlatma: 1977 · Sinyali Dünya\'ya ~23 saatte ulaşır', 'Launched: 1977 · Its signal takes ~23 hours to reach Earth'] },
  Voyager2: { n: ['Voyager 2', 'Voyager 2'], k: ['Uzay sondası', 'Space probe'],
    f: [['Uranus ve Neptune\'e giden tek araç.', 'The only spacecraft to visit Uranus and Neptune.'],
        ['Dört dev gezegenin hepsinin yanından geçti: Jupiter, Saturn, Uranus, Neptune.', 'It flew past all four giant planets: Jupiter, Saturn, Uranus and Neptune.'],
        ['2018\'de yıldızlararası uzaya geçti; hâlâ veri gönderiyor.', 'It reached interstellar space in 2018 and still sends data.']],
    s: ['Fırlatma: 1977 · Güneş\'ten ~140 AU', 'Launched: 1977 · ~140 AU from the Sun'] },
  Phobos: { n: ['Phobos', 'Phobos'], k: ['Uydu · Mars', 'Moon · Mars'],
    f: [['Mars\'ın iki küçük uydusundan büyüğü; patates biçiminde, yaklaşık 22 km.', 'The larger of Mars\'s two small moons: potato-shaped, about 22 km across.'],
        ['Mars\'a o kadar yakın ki günde üç kez doğup batar.', 'It orbits so close that it rises and sets three times a day.'],
        ['Yavaş yavaş Mars\'a yaklaşıyor; on milyonlarca yıl içinde parçalanacak.', 'It is slowly spiralling in and will break apart within tens of millions of years.']],
    s: ['Çap: ~22 km · Mars\'a uzaklık: 6.000 km', 'Size: ~22 km · Distance from Mars: 6,000 km'] },
  Io: { n: ['Io', 'Io'], k: ['Uydu · Jupiter', 'Moon · Jupiter'],
    f: [['Güneş Sistemi\'nin en yanardağlı yeri: 400\'den fazla aktif yanardağ.', 'The most volcanic place in the Solar System: more than 400 active volcanoes.'],
        ['Rengini yüzeyini kaplayan kükürtten alır.', 'Its colours come from sulfur covering the surface.'],
        ['Jupiter\'in çekimi onu sıkıp gevşeterek içini ısıtır.', 'Jupiter\'s gravity squeezes and flexes it, heating its interior.']],
    s: ['Çap: 3.643 km · Jupiter etrafında 1,8 günde döner', 'Diameter: 3,643 km · Orbits Jupiter in 1.8 days'] },
  Europa: { n: ['Europa', 'Europa'], k: ['Uydu · Jupiter', 'Moon · Jupiter'],
    f: [['Buz kabuğunun altında Dünya\'daki bütün okyanuslardan fazla su olduğu düşünülüyor.', 'Its ice shell is thought to hide more water than all of Earth\'s oceans.'],
        ['Yaşam aramak için en umut verici yerlerden biri.', 'One of the most promising places to look for life.'],
        ['Europa Clipper aracı 2030\'da oraya varacak.', 'The Europa Clipper spacecraft arrives there in 2030.']],
    s: ['Çap: 3.122 km · Yüzey: −160 °C buz', 'Diameter: 3,122 km · Surface: −160 °C ice'] },
  Ganymede: { n: ['Ganymede', 'Ganymede'], k: ['Uydu · Jupiter', 'Moon · Jupiter'],
    f: [['Güneş Sistemi\'nin en büyük uydusu; Mercury gezegeninden bile büyük.', 'The largest moon in the Solar System, bigger even than the planet Mercury.'],
        ['Kendi manyetik alanı olan tek uydu.', 'The only moon with its own magnetic field.'],
        ['1610\'da Galileo keşfetti.', 'Galileo discovered it in 1610.']],
    s: ['Çap: 5.268 km', 'Diameter: 5,268 km'] },
  Callisto: { n: ['Callisto', 'Callisto'], k: ['Uydu · Jupiter', 'Moon · Jupiter'],
    f: [['Güneş Sistemi\'nin en çok kraterli yüzeylerinden biri.', 'One of the most heavily cratered surfaces in the Solar System.'],
        ['Yüzeyi 4 milyar yıldır neredeyse hiç değişmedi.', 'Its surface has barely changed in 4 billion years.'],
        ['Jupiter\'in radyasyonundan uzak olduğu için gelecekteki bir üs için aday gösterilir.', 'Being far from Jupiter\'s radiation, it is suggested as a site for a future base.']],
    s: ['Çap: 4.821 km', 'Diameter: 4,821 km'] },
  Titan: { n: ['Titan', 'Titan'], k: ['Uydu · Saturn', 'Moon · Saturn'],
    f: [['Kalın havası olan tek uydu; turuncu bir sis onu sarar.', 'The only moon with a thick atmosphere, wrapped in orange haze.'],
        ['Yüzeyinde metan ve etandan oluşan göller ve nehirler var.', 'It has lakes and rivers of liquid methane and ethane.'],
        ['Huygens sondası 2005\'te yüzeyine indi; Dragonfly helikopteri 2034\'te varacak.', 'The Huygens probe landed there in 2005; the Dragonfly rotorcraft arrives in 2034.']],
    s: ['Çap: 5.150 km · Yüzey: −179 °C', 'Diameter: 5,150 km · Surface: −179 °C'] },
  Enceladus: { n: ['Enceladus', 'Enceladus'], k: ['Uydu · Saturn', 'Moon · Saturn'],
    f: [['Güney kutbundan uzaya su buharı ve buz fışkırtır.', 'It sprays water vapour and ice into space from its south pole.'],
        ['Buzunun altında tuzlu bir okyanus var.', 'A salty ocean lies beneath its ice.'],
        ['Güneş Sistemi\'nin en parlak, en beyaz cisimlerinden biri.', 'One of the brightest, whitest objects in the Solar System.']],
    s: ['Çap: 504 km', 'Diameter: 504 km'] },
  Triton: { n: ['Triton', 'Triton'], k: ['Uydu · Neptune', 'Moon · Neptune'],
    f: [['Gezegeninin dönüşünün tersine dolanan tek büyük uydu.', 'The only large moon that orbits backwards against its planet\'s spin.'],
        ['Büyük olasılıkla Kuiper kuşağından yakalanmış bir cüce gezegen.', 'Probably a dwarf planet captured from the Kuiper belt.'],
        ['Yüzeyinden azot gayzerleri fışkırır; −235 °C ile çok soğuktur.', 'Nitrogen geysers erupt from its −235 °C surface.']],
    s: ['Çap: 2.707 km', 'Diameter: 2,707 km'] },
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
// mission list, by kind; ORDER is the same list flattened (the "next target" order and the badge count)
const CATS = [[['Güneş ve gezegenler', 'Sun and planets'], ['Earth', 'Mars', 'Venus', 'Mercury', 'Sun', 'Ceres', 'Jupiter', 'Saturn', 'Uranus', 'Neptune']],
  [['Uydular', 'Moons'], ['Moon', 'Phobos', 'Io', 'Europa', 'Ganymede', 'Callisto', 'Titan', 'Enceladus', 'Triton']],
  [['İstasyonlar ve uzay araçları', 'Stations and spacecraft'], ['ISS', 'Tiangong', 'Hubble', 'JWST', 'Parker', 'Voyager1', 'Voyager2']],
  [['Yıldızlar', 'Stars'], ['AlphaCen', 'Sirius', 'Vega', 'Betelgeuse']]];
const ORDER = ['Earth', 'ISS', 'Moon', 'Hubble', 'Tiangong', 'JWST', 'Mars', 'Phobos', 'Venus', 'Mercury', 'Sun', 'Parker', 'Ceres', 'Jupiter', 'Io', 'Europa', 'Ganymede', 'Callisto', 'Saturn', 'Titan', 'Enceladus', 'Uranus', 'Neptune', 'Triton', 'Voyager2', 'Voyager1', 'AlphaCen', 'Sirius', 'Vega', 'Betelgeuse'];
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
let OCT = 0; // extra octaves while painting the close-up maps
function fbm(x, y, z, o = 5) { o += OCT; let a = 0.5, s = 0, f = 1; for (let i = 0; i < o; i++) { s += a*noise3(x*f, y*f, z*f); f *= 2.03; a *= 0.5; } return s/(1 - Math.pow(0.5, o)); }
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
// the same painter as a generator, a few rows per call, so a close-up map can be painted between frames
function* paintGen(w, h, fn, done) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'), im = g.createImageData(w, h), d = im.data;
  for (let j = 0; j < h; j++) { const lat = (0.5 - (j + 0.5)/h)*Math.PI, cl = Math.cos(lat), y = Math.sin(lat);
    for (let i = 0; i < w; i++) { const lon = (i + 0.5)/w*Math.PI*2, x = cl*Math.cos(lon), z = cl*Math.sin(lon), p = fn(x, y, z, lat, lon), k = (j*w + i)*4;
      d[k] = p[0]; d[k + 1] = p[1]; d[k + 2] = p[2]; d[k + 3] = p.length > 3 ? p[3] : 255; }
    if ((j & 3) === 3) yield; }
  g.putImageData(im, 0, 0);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; done(t);
}
function bands(cols, y, n, warp, k) { const t = (y*k + n*warp + 8)*cols.length; const i = Math.floor(t), f = t - i; return mix3(cols[((i % cols.length) + cols.length) % cols.length], cols[(((i + 1) % cols.length) + cols.length) % cols.length], sm(0, 1, f)); }
const TEX = {
  earthNight: [512, 256, (x, y, z, lat) => {
    const h = fbm(x*2.1 + 11, y*2.1, z*2.1, 6), al = Math.abs(lat)/(Math.PI/2);
    if (h < 0.535 || al > 0.8) return [0, 0, 0];
    const k = sm(0.62, 0.9, noise3(x*70, y*70, z*70))*sm(0.4, 0.75, fbm(x*9 + 2, y*9, z*9, 3))*(1 - al*0.6);
    return [255*k, 185*k, 105*k]; }],
  mercury: [256, 128, (x, y, z) => { const n = fbm(x*4, y*4, z*4), c = Math.abs(noise3(x*14, y*14, z*14) - 0.5); const v = 95 + n*90 - (c < 0.06 ? 30 : 0); return [v*1.02, v*0.97, v*0.92]; }],
  ceres: [256, 128, (x, y, z) => { const n = fbm(x*5, y*5, z*5), c = Math.abs(noise3(x*16, y*16, z*16) - 0.5), b = noise3(x*30 + 9, y*30, z*30) > 0.93 ? 120 : 0; const v = 70 + n*60 - (c < 0.05 ? 20 : 0) + b; return [v, v*0.98, v*0.95]; }],
  venus: [256, 128, (x, y, z) => { const w = fbm(x*2 + 3, y*2, z*2), n = fbm(x*3 + w*2, y*6 + w, z*3); return mix3(hex('#b98d4f'), hex('#f2deae'), sm(0.3, 0.75, n)); }],
  earth: [512, 256, (x, y, z, lat) => {
    const h = fbm(x*2.1 + 11, y*2.1, z*2.1, 6), al = Math.abs(lat)/(Math.PI/2);
    if (al > 0.86 + (h - 0.5)*0.15) return [235, 242, 250];
    if (h < 0.53) { const d = sm(0.3, 0.53, h); return mix3(hex('#08214f'), hex('#1d5fa3'), d); }
    const dry = sm(0.15, 0.45, 1 - Math.abs(al - 0.28)*3) * sm(0.5, 0.8, fbm(x*5, y*5, z*5 + 4));
    return mix3(mix3(hex('#2f6b2a'), hex('#5c7d34'), sm(0.53, 0.68, h)), hex('#b89a63'), dry*0.85); }],
  clouds: [512, 256, (x, y, z) => { const n = fbm(x*3 + 5, y*5, z*3, 6); const a = sm(0.5, 0.78, n)*255; return [255, 255, 255, a]; }],
  mars: [512, 256, (x, y, z, lat) => { const n = fbm(x*3, y*3, z*3, 6), d = fbm(x*2 + 7, y*2, z*2), al = Math.abs(lat)/(Math.PI/2);
    if (al > 0.9 + (n - 0.5)*0.1) return [238, 232, 228];
    return mix3(mix3(hex('#9c3c17'), hex('#d9784a'), n), hex('#4f2414'), sm(0.55, 0.75, d)*0.75); }],
  jupiter: [512, 256, (x, y, z, lat, lon) => {
    const n = fbm(x*4, y*9, z*4); let c = bands([hex('#e9dcc4'), hex('#c49a6c'), hex('#f3ead8'), hex('#a8714a'), hex('#e2c9a3'), hex('#8c5a3c')], y, n, 0.06, 1.15);
    const dl = (lat + 22*D2R)/0.07, dn = Math.atan2(Math.sin(lon - 3.6), Math.cos(lon - 3.6))/0.16, e = dl*dl + dn*dn;
    if (e < 1) c = mix3(c, hex('#b4482c'), sm(1, 0.3, e)); return c; }],
  saturn: [512, 256, (x, y, z) => { const n = fbm(x*4, y*10, z*4); return bands([hex('#f1e2b8'), hex('#d8bd84'), hex('#efe0bd'), hex('#c7a66a'), hex('#e6d2a2')], y, n, 0.04, 0.9); }],
  uranus: [256, 128, (x, y, z) => { const n = fbm(x*3, y*12, z*3); return mix3(hex('#8fd6de'), hex('#b8eef0'), sm(0.35, 0.7, n)*0.6 + y*0.15); }],
  neptune: [256, 128, (x, y, z, lat, lon) => { const n = fbm(x*3, y*10, z*3); let c = mix3(hex('#2c4fc2'), hex('#5b84ea'), sm(0.3, 0.75, n));
    const dl = (lat + 20*D2R)/0.09, dn = Math.atan2(Math.sin(lon - 1.2), Math.cos(lon - 1.2))/0.2; if (dl*dl + dn*dn < 1) c = mix3(c, hex('#1a2a72'), 0.7); return c; }],
  moon: [256, 128, (x, y, z) => { const n = fbm(x*3, y*3, z*3), m = sm(0.55, 0.62, fbm(x*1.5 + 4, y*1.5, z*1.5)), c = Math.abs(noise3(x*18, y*18, z*18) - 0.5); const v = 150 + n*60 - m*60 - (c < 0.05 ? 25 : 0); return [v, v, v*0.98]; }],
  io: [256, 128, (x, y, z) => { const n = fbm(x*4, y*4, z*4), sp = sm(0.62, 0.7, noise3(x*9 + 3, y*9, z*9)); let c = mix3(hex('#e8d26a'), hex('#d49a3c'), n); c = mix3(c, hex('#3a2a1a'), sp*0.8); return mix3(c, hex('#f4f0d8'), sm(0.7, 0.85, fbm(x*6 + 5, y*6, z*6))*0.6); }],
  europa: [256, 128, (x, y, z) => { const n = fbm(x*3, y*3, z*3), ln = Math.abs(noise3(x*7, y*7, z*7) - 0.5) < 0.025 || Math.abs(noise3(x*13 + 4, y*13, z*13) - 0.5) < 0.015; return ln ? hex('#a0603a') : mix3(hex('#e9e2d6'), hex('#c9b8a0'), n*0.8); }],
  ganymede: [256, 128, (x, y, z) => { const n = fbm(x*3, y*3, z*3, 6), d = sm(0.5, 0.6, fbm(x*2 + 9, y*2, z*2)); return mix3(mix3(hex('#a9a092'), hex('#d8d0c2'), n), hex('#5f574c'), d*0.8); }],
  callisto: [256, 128, (x, y, z) => { const n = fbm(x*5, y*5, z*5), c = Math.abs(noise3(x*20, y*20, z*20) - 0.5) < 0.05 ? 50 : 0; const v = 62 + n*55 + c*0.7; return [v, v*0.95, v*0.9]; }],
  titan: [256, 128, (x, y, z) => { const n = fbm(x*2, y*5, z*2); return mix3(hex('#c98a3a'), hex('#e8b060'), n); }],
  enceladus: [256, 128, (x, y, z) => { const n = fbm(x*5, y*5, z*5), t = y < -0.8 && Math.abs(noise3(x*12, y*12, z*12) - 0.5) < 0.04; return t ? hex('#7fa8c8') : mix3(hex('#f6f8fb'), hex('#d6dde6'), n); }],
  triton: [256, 128, (x, y, z) => { const n = fbm(x*4, y*4, z*4), cap = sm(-0.1, 0.3, -y); return mix3(mix3(hex('#b9a8a0'), hex('#e8d8d0'), n), hex('#f3e6ea'), cap*0.7); }],
  rock: [256, 128, (x, y, z) => { const n = fbm(x*4, y*4, z*4), v = 60 + n*80; return [v*1.05, v, v*0.92]; }]
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
    void main(){ float r = 1.0 - abs(dot(vN, vV)); float i = pow(r, 2.6); float lit = 0.06 + 0.94*smoothstep(-0.3, 0.5, dot(vW, uSun));
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
#gk .gkbar { height: 5px; border-radius: 3px; background: rgba(255,255,255,.08); overflow: hidden; margin-top: 3px; }
#gk .gkbar i { display: block; height: 100%; width: 0; background: linear-gradient(90deg, #6fb3ff, #e3c27e); border-radius: 3px; }
#gk .gkbar.sh i { background: linear-gradient(90deg, #ff6b5a, #7ef0c2); }
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
#gk .card { position: absolute; left: 50%; bottom: max(14px, env(safe-area-inset-bottom)); transform: translate(-50%, 30px); width: min(520px, calc(100vw - 24px)); max-height: min(62vh, calc(100vh - 110px)); overflow: auto; padding: 18px 18px 16px; border-radius: 18px; background: rgba(9,11,22,.9); border: 1px solid rgba(227,194,126,.35); box-shadow: 0 20px 60px rgba(0,0,0,.6); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); opacity: 0; pointer-events: none; transition: opacity .35s, transform .35s; z-index: 3; }
#gk .card.show { opacity: 1; transform: translate(-50%, 0); pointer-events: auto; }
#gk .card .kk { font: 600 10.5px var(--f-ui, Manrope); letter-spacing: .16em; text-transform: uppercase; color: #8e93a3; }
#gk .card h3 { margin: 2px 0 6px; font: 600 28px var(--f-name, Georgia, serif); line-height: 1.05; }
#gk .card ul { margin: 8px 0; padding-left: 18px; }
#gk .card li { margin: 5px 0; font: italic 500 16px var(--f-name, Georgia, serif); line-height: 1.32; color: #ddd6c6; }
#gk .card .st { font: 500 12px var(--f-num, Menlo, monospace); color: #a9a597; margin: 8px 0 12px; line-height: 1.5; }
#gk .card .gkrow { display: flex; gap: 8px; flex-wrap: wrap; }
#gk .card .ans { display: grid; gap: 8px; margin: 10px 0; }
#gk .card .ans .b { border-radius: 12px; text-align: left; padding: 11px 13px; font-size: 14px; white-space: normal; }
#gk .card .ans .b.ok { background: rgba(126,240,194,.2); border-color: #7ef0c2; }
#gk .card .ans .b.no { background: rgba(255,107,90,.18); border-color: #ff6b5a; }
#gk .gkbadge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; background: rgba(227,194,126,.16); color: #e3c27e; font: 700 11px var(--f-ui, Manrope); letter-spacing: .08em; text-transform: uppercase; animation: gkpop .6s cubic-bezier(.2,1.6,.4,1); }
@keyframes gkpop { 0% { transform: scale(.3); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
#gk .gklist { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-top: 10px; }
#gk .gklist .gkcat { grid-column: 1 / -1; margin: 8px 0 0; font: 600 10.5px var(--f-ui, Manrope); letter-spacing: .14em; text-transform: uppercase; color: #8e93a3; }
#gk .gklist .b { border-radius: 12px; text-align: left; padding: 10px 12px; white-space: normal; display: grid; gap: 2px; }
#gk .gklist .b small { font: 500 11px var(--f-ui, Manrope); color: #8e93a3; }
#gk .gklist .b.got { border-color: rgba(126,240,194,.55); }
#gk .gklist .b.cur { background: rgba(227,194,126,.18); }
#gk .gkchip { position: absolute; left: 50%; top: calc(max(10px, env(safe-area-inset-top)) + 78px); transform: translate(-50%, -12px); width: min(440px, calc(100vw - 32px)); box-sizing: border-box; display: grid; grid-template-columns: 1fr auto; column-gap: 10px; align-items: center; text-align: left; padding: 9px 14px; border-radius: 14px; border: 1px solid rgba(227,194,126,.45); background: rgba(9,11,22,.78); color: #e9e4d8; backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); opacity: 0; pointer-events: none; transition: opacity .35s, transform .35s; cursor: pointer; z-index: 2; }
#gk .gkchip.show { opacity: 1; transform: translate(-50%, 0); pointer-events: auto; }
#gk .gkchip b { font: italic 600 19px var(--f-name, Georgia, serif); color: #e3c27e; }
#gk .gkchip span { grid-column: 1; font: 500 12.5px var(--f-ui, Manrope); color: #c9c4b6; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
#gk .gkchip i { grid-column: 2; grid-row: 1 / span 2; font: 600 12px var(--f-ui, Manrope); font-style: normal; color: #e3c27e; white-space: nowrap; }
#gk .gkmap { position: absolute; left: 12px; top: calc(max(10px, env(safe-area-inset-top)) + 50px); width: 160px; height: 160px; border-radius: 14px; background: rgba(10,13,24,.82); border: 1px solid rgba(233,228,216,.14); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); cursor: pointer; }
@media (max-width: 520px) { #gk .dash { gap: 6px; padding: 0 8px; } #gk .dash .b { padding: 8px 10px; font-size: 12px; } #gk .gauge { min-width: 0; width: 30vw; padding: 6px 9px; } #gk .gauge .l { letter-spacing: .04em; } #gk .hint { bottom: auto; top: calc(max(10px, env(safe-area-inset-top)) + 150px); } }
@media (max-width: 700px) { #gk .gkmap { width: 116px; height: 116px; top: auto; bottom: calc(max(12px, env(safe-area-inset-bottom)) + 70px); } }
#gk .gkbig { position: absolute; left: 10px; right: 10px; top: max(10px, env(safe-area-inset-top)); bottom: max(10px, env(safe-area-inset-bottom)); z-index: 5; display: flex; flex-direction: column; border-radius: 18px; background: rgba(7,9,18,.985); border: 1px solid rgba(233,228,216,.14); box-shadow: 0 20px 60px rgba(0,0,0,.6); overflow: hidden; }
#gk .gkbig .hd { display: flex; align-items: center; gap: 10px; padding: 12px 12px 8px 16px; }
#gk .gkbig .hd > b { font: italic 600 24px var(--f-name, Georgia, serif); color: #e3c27e; }
#gk .gkbig .tabs { flex: 1; display: flex; gap: 6px; justify-content: center; flex-wrap: wrap; }
#gk .gkbig .tabs .b { padding: 6px 11px; font-size: 12px; }
#gk .gkbig canvas { position: relative; flex: 1; width: 100%; min-height: 0; touch-action: none; cursor: grab; background: radial-gradient(ellipse at center, rgba(20,26,48,.5), rgba(0,0,0,0) 70%); }
#gk .gkbig .ft { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 10px 14px 14px; border-top: 1px solid rgba(233,228,216,.08); min-height: 44px; font: 500 12px var(--f-ui, Manrope); color: #a9a597; }
#gk .gkbig .ft .lg { display: inline-flex; align-items: center; gap: 6px; } #gk .gkbig .ft .lg i { width: 14px; height: 3px; border-radius: 2px; display: inline-block; }
#gk .gkbig .ft .tip { margin-left: auto; color: #8e93a3; }
#gk .gkbig .ft .sel { flex: 1; display: grid; gap: 2px; min-width: 0; } #gk .gkbig .ft .sel b { font: italic 600 20px var(--f-name, Georgia, serif); color: #e9e4d8; } #gk .gkbig .ft .sel small { color: #8e93a3; }
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
  <div class="top"><button class="b" id="gkX">✕ ${L('Çık', 'Exit')}</button><div class="tgt"><div class="k" id="gkTk"></div><div class="n" id="gkTn"></div><div class="d" id="gkTd"></div></div><button class="b" id="gkView"></button><button class="b" id="gkList">★ <span id="gkCnt"></span></button></div>
  <div class="msg" id="gkMsg"></div>
  <div class="hint" id="gkHint"></div>
  <div class="joy" id="gkJoy"><i></i></div>
  <div class="thr" id="gkThr"><span>${L('GAZ', 'THRUST')}</span><i></i></div>
  <button class="turbo" id="gkTurbo">TURBO</button>
  <div class="dash"><button class="b" id="gkAuto">${L('Otopilot', 'Autopilot')}</button><div class="gauge"><div class="l"><span>${L('Hız', 'Speed')}</span><span id="gkSp"></span></div><div class="gkbar"><i id="gkSpB"></i></div><div class="l"><span>${L('Kalkan', 'Shield')}</span><span id="gkShT"></span></div><div class="gkbar sh"><i id="gkSh"></i></div></div><button class="b on" id="gkDock" hidden></button><button class="b" id="gkStop">${L('Dur', 'Stop')}</button></div>
  <canvas class="gkmap" id="gkMap"></canvas><div class="gkbig" id="gkBig" hidden><div class="hd"><b>${L('Harita', 'Map')}</b><div class="tabs"><button class="b" data-m="sys">${L('Sistem', 'System')}</button><button class="b" data-m="near">${L('Yakın', 'Nearby')}</button><button class="b" data-m="stars">${L('Yıldızlar', 'Stars')}</button></div><button class="b" id="gkBigX">✕</button></div><canvas id="gkBigC"></canvas><div class="ft" id="gkBigFt"></div></div><button class="gkchip" id="gkChip"></button><div class="card" id="gkCard"></div>`;
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
    MC[i*3] = col[0]; MC[i*3 + 1] = col[1]; MC[i*3 + 2] = col[2]; MS[i] = 1.4 + Math.random()*2.2; MA[i] = 0.03 + 0.07*Math.random()*(0.5 + toC);
  }
  const mw = new THREE.Points(mg, ptsMat(false)); mw.frustumCulled = false; grp.add(mw);
  // a few soft nebula glows along the plane
  const neb = glowTex([[0, 'rgba(255,255,255,.55)'], [0.4, 'rgba(255,255,255,.14)'], [1, 'rgba(255,255,255,0)']]);
  const ncol = [0x6f8cff, 0xff7ea8, 0xffc98a, 0x8affd9, 0xb48aff];
  for (let i = 0; i < 26; i++) { const l = (i/26)*Math.PI*2 + Math.random()*0.2, b = gauss()*0.08;
    const v = gx.clone().multiplyScalar(Math.cos(b)*Math.cos(l)).add(gy.clone().multiplyScalar(Math.cos(b)*Math.sin(l))).add(ngp.clone().multiplyScalar(Math.sin(b))).multiplyScalar(R*0.97);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: neb, color: ncol[i % 5], transparent: true, opacity: 0.05 + Math.random()*0.06*(0.5 + (Math.cos(l)*0.5 + 0.5)), blending: THREE.AdditiveBlending, depthWrite: false }));
    s.position.copy(v); s.scale.setScalar(R*(0.18 + Math.random()*0.25)); grp.add(s); }
  // the glow itself: a map painted in galactic longitude/latitude, with dark dust lanes and a bright bulge toward Sagittarius
  const mwc = document.createElement('canvas'); mwc.width = 1024; mwc.height = 512; const mg2 = mwc.getContext('2d'), mim = mg2.createImageData(1024, 512), md = mim.data;
  for (let j = 0; j < 512; j++) { const b = (0.5 - (j + 0.5)/512)*Math.PI;
    for (let i = 0; i < 1024; i++) { const l = (i + 0.5)/1024*Math.PI*2, cb = Math.cos(b), x = cb*Math.cos(l), y = cb*Math.sin(l), z = Math.sin(b);
      const toC = Math.pow(Math.cos(l)*0.5 + 0.5, 3), wid = 0.09 + 0.16*toC, band = Math.exp(-Math.pow(b/wid, 2));
      const cl = fbm(x*5 + 1, y*5, z*5, 5), fine = fbm(x*16, y*16, z*16, 3), lane = sm(0.5, 0.68, fbm(x*7 + 4, y*7, z*7, 4))*Math.exp(-Math.pow(b/0.045, 2));
      let I = band*(0.35 + 0.9*cl*(0.7 + 0.5*fine))*(0.45 + 0.9*toC) + Math.exp(-Math.pow(b/0.5, 2))*0.05; I *= 1 - lane*0.75;
      const warm = Math.min(1, toC*1.4), k = (j*1024 + i)*4, pink = sm(0.72, 0.85, fine)*band*0.5;
      md[k] = Math.min(255, I*(150 + 90*warm) + pink*120); md[k + 1] = Math.min(255, I*(160 + 40*warm)); md[k + 2] = Math.min(255, I*(205 - 60*warm) + pink*70); md[k + 3] = 255; } }
  mg2.putImageData(mim, 0, 0); const mwt = new THREE.CanvasTexture(mwc); mwt.encoding = THREE.sRGBEncoding;
  const mws = new THREE.Mesh(new THREE.SphereGeometry(R*0.99, 96, 48), new THREE.MeshBasicMaterial({ map: mwt, side: THREE.BackSide, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
  mws.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(gx.clone().negate(), ngp, gy)); mws.renderOrder = -2; grp.add(mws);
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
  const rocky = ['Mercury', 'Moon', 'Mars', 'Ceres', 'Proxima b', 'Phobos', 'Io', 'Ganymede', 'Callisto', 'Triton'].includes(p.id);
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, metalness: 0 });
  if (rocky) { mat.bumpMap = tex; mat.bumpScale = 0.12; }
  if (p.id === 'Earth') {
    mat.emissiveMap = G.tex.earthNight; mat.emissive = new THREE.Color(0xffffff); mat.emissiveIntensity = 1.4; mat.roughness = 0.75;
    mat.onBeforeCompile = sh => { sh.uniforms.uSunV = G.sunV; sh.fragmentShader = 'uniform vec3 uSunV;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance *= smoothstep(0.12, -0.22, dot(normal, uSunV));'); };
  }
  const body = new THREE.Mesh(new THREE.SphereGeometry(p.r, 96, 64), mat);
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

// close-up maps: painted at 3-4x once the shuttle comes near, the Moon gets the real LRO map
function requestHi(b) {
  if (b.hi || !b.obj.userData.body) return; b.hi = true;
  const m = b.obj.userData.body.material;
  if (b.id === 'Moon') { new THREE.TextureLoader().load('foto/moon.jpg', t => { t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; m.map = t; m.bumpMap = t; m.bumpScale = 0.05; m.needsUpdate = true; }); return; }
  if (!b.p || !TEX[b.p.tex]) return;
  const job = (key, k, set) => { const [w, h, fn] = TEX[key]; G.hiQ.push(paintGen(w*k, h*k, fn, set)); };
  job(b.p.tex, TEX[b.p.tex][0] >= 512 ? 3 : 4, t => { m.map = t; if (m.bumpMap) m.bumpMap = t; m.needsUpdate = true; });
  if (b.id === 'Earth') { job('earthNight', 3, t => { m.emissiveMap = t; m.needsUpdate = true; }); const cm = b.obj.userData.clouds.material; job('clouds', 3, t => { cm.map = t; cm.needsUpdate = true; }); }
}
function runPaintJobs(ms) {
  const t0 = performance.now(); OCT = 2;
  try { while (performance.now() - t0 < ms) { if (!G.task) { G.task = G.hiQ.shift() || null; if (!G.task) break; } if (G.task.next().done) G.task = null; } } finally { OCT = 0; }
}

// space stations, at roughly the shuttle's scale (ISS ~3x the orbiter's length)
// solar array blanket: a grid of cells with a bright frame; gold for ISS, deep blue for Tiangong
function panelTex(base, line) {
  const c = document.createElement('canvas'); c.width = 64; c.height = 512; const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, 64, 512);
  for (let y = 0; y < 512; y += 8) for (let x = 0; x < 64; x += 8) { const v = Math.random()*0.18; g.fillStyle = 'rgba(255,255,255,' + v*0.35 + ')'; g.fillRect(x + 1, y + 1, 6, 6); }
  g.strokeStyle = line; g.lineWidth = 1; for (let y = 0; y <= 512; y += 8) { g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(64, y + 0.5); g.stroke(); } for (let x = 0; x <= 64; x += 8) { g.beginPath(); g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, 512); g.stroke(); }
  g.lineWidth = 3; g.strokeRect(1.5, 1.5, 61, 509); for (let y = 64; y < 512; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(64, y); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; return t;
}
// open lattice for trusses: X-bracing with transparent gaps
function latticeTex() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 32; const g = c.getContext('2d'); g.strokeStyle = '#fff'; g.lineWidth = 3;
  g.strokeRect(1.5, 1.5, 125, 29); for (let x = 0; x < 128; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 32, 32); g.moveTo(x + 32, 0); g.lineTo(x, 32); g.moveTo(x, 0); g.lineTo(x, 32); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; return t;
}
function makeStation(kind) {
  const g = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({ color: 0xe9e7e1, roughness: 0.55, metalness: 0.15 }), metal = new THREE.MeshStandardMaterial({ color: 0x9ea1a8, roughness: 0.35, metalness: 0.75 });
  const mli = new THREE.MeshStandardMaterial({ color: 0xd9cfae, roughness: 0.4, metalness: 0.35 }), dark = new THREE.MeshStandardMaterial({ color: 0x2a2c31, roughness: 0.6, metalness: 0.3 });
  const lat = latticeTex();
  const box = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); g.add(o); return o; };
  const cyl = (r, l, m, x, y, z, axis, seg) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, seg || 18), m); o.position.set(x, y, z); if (axis === 'z') o.rotation.x = Math.PI/2; if (axis === 'x') o.rotation.z = Math.PI/2; g.add(o); return o; };
  const ring = (r, x, y, z, axis) => cyl(r*1.08, 0.008, metal, x, y, z, axis);
  const module = (r, l, x, y, z, axis, m) => { cyl(r, l, m || white, x, y, z, axis); const h = l/2 - 0.004; const off = axis === 'z' ? [0, 0, h] : axis === 'x' ? [h, 0, 0] : [0, h, 0];
    ring(r, x + off[0], y + off[1], z + off[2], axis); ring(r, x - off[0], y - off[1], z - off[2], axis); };
  // a solar wing: mast plus two blankets, from (x, y, z) along dir (+1/-1 on axis)
  const wing = (tex, x, y, z, axis, dir, len, wid) => {
    const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.32, metalness: 0.55, side: THREE.DoubleSide });
    [-1, 1].forEach(sd => { const b = new THREE.Mesh(new THREE.PlaneGeometry(wid, len), m);
      if (axis === 'z') { b.rotation.x = -Math.PI/2; b.position.set(x + sd*(wid/2 + 0.006), y, z + dir*(len/2 + 0.03)); }
      else { b.rotation.y = 0; b.position.set(x + dir*0, y + dir*(len/2 + 0.03), z + sd*(wid/2 + 0.006)); b.rotation.y = Math.PI/2; }
      g.add(b); });
    if (axis === 'z') cyl(0.004, len, metal, x, y, z + dir*(len/2 + 0.03), 'z', 6); else cyl(0.004, len, metal, x, y + dir*(len/2 + 0.03), z, 'y', 6);
  };
  if (kind === 'ISS') {
    // integrated truss with see-through lattice
    const tm = new THREE.MeshStandardMaterial({ color: 0xc9c6bd, roughness: 0.5, metalness: 0.6, map: lat, alphaMap: lat, alphaTest: 0.5, side: THREE.DoubleSide });
    lat.repeat.set(10, 1); const truss = box(1.76, 0.055, 0.055, tm, 0, 0, 0);
    box(1.6, 0.02, 0.02, metal, 0, 0, 0);
    // eight gold solar wings, two rotary joints per side
    const gold = panelTex('#8a5a1c', 'rgba(255,214,140,.55)');
    [-0.84, -0.64, 0.64, 0.84].forEach(x => { cyl(0.03, 0.06, metal, x, 0, 0, 'y'); wing(gold, x, 0, 0.0, 'z', 1, 0.62, 0.048); wing(gold, x, 0, 0.0, 'z', -1, 0.62, 0.048); });
    [-0.74, 0.74].forEach(x => cyl(0.036, 0.07, metal, x, 0, 0, 'x'));
    // white radiators hanging below the truss
    [-0.32, -0.22, 0.22, 0.32].forEach((x, i) => { for (let k = 0; k < 3; k++) box(0.09, 0.003, 0.11, white, x, -0.06 - k*0.07, 0.0).rotation.x = 0.0; });
    // pressurised modules along z, under the truss: Harmony, Destiny, Unity, Zarya, Zvezda + Columbus, Kibo, Cupola
    module(0.044, 0.1, 0, -0.085, -0.13, 'z'); module(0.046, 0.17, 0, -0.085, 0.005, 'z', mli); module(0.044, 0.09, 0, -0.085, 0.14, 'z');
    module(0.041, 0.17, 0, -0.085, 0.27, 'z', mli); module(0.042, 0.16, 0, -0.085, 0.44, 'z');
    module(0.044, 0.13, 0.11, -0.085, -0.13, 'x', mli); module(0.046, 0.2, -0.14, -0.085, -0.13, 'x');
    box(0.08, 0.02, 0.07, dark, -0.22, -0.085, -0.13);
    cyl(0.02, 0.025, dark, 0, -0.14, 0.14, 'y');
    // Zvezda's own small arrays and a Soyuz at the aft port
    const blu = panelTex('#1d2f5e', 'rgba(150,180,255,.5)');
    [1, -1].forEach(sd => { const b = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.05), new THREE.MeshStandardMaterial({ map: blu, roughness: 0.3, metalness: 0.5, side: THREE.DoubleSide })); b.position.set(sd*0.13, -0.085, 0.46); g.add(b); });
    module(0.028, 0.08, 0, -0.085, 0.565, 'z', mli); cyl(0.022, 0.03, dark, 0, -0.085, 0.62, 'z');
    // docking adapter at Harmony's front (shuttle port)
    cyl(0.03, 0.05, mli, 0, -0.085, -0.205, 'z'); cyl(0.034, 0.012, metal, 0, -0.085, -0.232, 'z');
  } else {
    // Tianhe core, node sphere, Wentian and Mengtian labs in a T, each lab with long blue wings
    const blu = panelTex('#16285a', 'rgba(140,175,255,.55)');
    module(0.065, 0.36, 0, 0, 0.15, 'z'); module(0.05, 0.1, 0, 0, 0.36, 'z');
    const node = new THREE.Mesh(new THREE.SphereGeometry(0.06, 20, 14), white); node.position.set(0, 0, -0.06); g.add(node);
    [1, -1].forEach(sd => { module(0.06, 0.42, sd*0.27, 0, -0.06, 'x', sd > 0 ? white : mli); cyl(0.045, 0.06, white, sd*0.51, 0, -0.06, 'x');
      wing(blu, sd*0.53, 0, -0.06, 'z', 1, 0.5, 0.07); wing(blu, sd*0.53, 0, -0.06, 'z', -1, 0.5, 0.07); });
    wing(blu, 0, 0, 0.2, 'y', 1, 0.24, 0.06); wing(blu, 0, 0, 0.2, 'y', -1, 0.24, 0.06);
    cyl(0.03, 0.03, dark, 0, 0, 0.42, 'z');
    for (let k = 0; k < 4; k++) box(0.12, 0.003, 0.05, white, 0, 0.075, 0.03 + k*0.06);
  }
  return g;
}

// spacecraft, at the same small scale as the stations
function makeCraft(kind) {
  const g = new THREE.Group(), V2 = (x, y) => new THREE.Vector2(x, y);
  const white = new THREE.MeshStandardMaterial({ color: 0xe9e7e1, roughness: 0.5, metalness: 0.2 }), metal = new THREE.MeshStandardMaterial({ color: 0xa4a7ae, roughness: 0.3, metalness: 0.85 });
  const foil = new THREE.MeshStandardMaterial({ color: 0xc8a050, roughness: 0.3, metalness: 0.8 }), dark = new THREE.MeshStandardMaterial({ color: 0x26282e, roughness: 0.6, metalness: 0.3 });
  const blu = panelTex('#1d2f5e', 'rgba(150,180,255,.5)'), bluM = new THREE.MeshStandardMaterial({ map: blu, roughness: 0.3, metalness: 0.5, side: THREE.DoubleSide });
  const add = (geo, m, x, y, z, rx, ry, rz) => { const o = new THREE.Mesh(geo, m); o.position.set(x || 0, y || 0, z || 0); o.rotation.set(rx || 0, ry || 0, rz || 0); g.add(o); return o; };
  if (kind === 'Hubble') {
    add(new THREE.CylinderGeometry(0.075, 0.075, 0.42, 24), new THREE.MeshStandardMaterial({ color: 0xd8dade, roughness: 0.25, metalness: 0.9 }), 0, 0, 0, Math.PI/2);
    add(new THREE.CylinderGeometry(0.08, 0.08, 0.14, 24), foil, 0, 0, 0.27, Math.PI/2);
    const door = add(new THREE.CircleGeometry(0.075, 20), white, 0, 0.07, -0.25, -0.9); door.material = new THREE.MeshStandardMaterial({ color: 0xd8dade, metalness: 0.8, roughness: 0.3, side: THREE.DoubleSide });
    [1, -1].forEach(sd => { add(new THREE.PlaneGeometry(0.11, 0.36), bluM, sd*0.17, 0, 0.12, 0, 0, 0); add(new THREE.CylinderGeometry(0.004, 0.004, 0.13, 6), metal, sd*0.1, 0, 0.12, 0, 0, Math.PI/2); });
    add(new THREE.CylinderGeometry(0.01, 0.01, 0.1, 8), white, 0, 0.1, 0.1);
  } else if (kind === 'JWST') {
    // five-layer diamond sunshield, the gold honeycomb mirror on a tower, secondary mirror on a tripod
    const sh = new THREE.Shape([V2(-0.55, 0), V2(0, -0.3), V2(0.55, 0), V2(0, 0.3)]);
    for (let k = 0; k < 5; k++) { const m = new THREE.MeshStandardMaterial({ color: k ? 0xb9a7c8 : 0xd8c7e8, roughness: 0.25, metalness: 0.85, side: THREE.DoubleSide }); const l = add(new THREE.ShapeGeometry(sh), m, 0, -0.03 + k*0.018, 0, -Math.PI/2); l.scale.setScalar(1 - k*0.06); }
    const gold = new THREE.MeshStandardMaterial({ color: 0xffc04a, roughness: 0.18, metalness: 1, emissive: 0x2a1600 });
    const hex6 = new THREE.CylinderGeometry(0.043, 0.043, 0.01, 6); const mir = new THREE.Group(); mir.position.set(0, 0.2, -0.06); mir.rotation.x = -0.25; g.add(mir);
    [[0, 0], [1, 0], [-1, 0], [0.5, 0.866], [-0.5, 0.866], [0.5, -0.866], [-0.5, -0.866], [2, 0], [-2, 0], [1.5, 0.866], [-1.5, 0.866], [1.5, -0.866], [-1.5, -0.866], [1, 1.732], [-1, 1.732], [0, 1.732], [1, -1.732], [-1, -1.732], [0, -1.732]].slice(1).forEach(([a, b]) => {
      const s = new THREE.Mesh(hex6, gold); s.position.set(a*0.075, b*0.075, 0); s.rotation.x = Math.PI/2; s.rotation.y = Math.PI/6; mir.add(s); });
    add(new THREE.CylinderGeometry(0.03, 0.04, 0.12, 8), dark, 0, 0.1, -0.02);
    [[0, 0.11], [-0.1, -0.07], [0.1, -0.07]].forEach(([x, y]) => { const a = new THREE.Vector3(x, 0.2 + y, -0.06), b = new THREE.Vector3(0, 0.22, 0.2), d = b.clone().sub(a);
      const t = add(new THREE.CylinderGeometry(0.003, 0.003, d.length(), 5), metal); t.position.copy(a).add(b).multiplyScalar(0.5); t.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); });
    add(new THREE.SphereGeometry(0.015, 10, 8), gold, 0, 0.22, 0.2);
    add(new THREE.BoxGeometry(0.12, 0.05, 0.12), dark, 0, -0.07, 0); add(new THREE.PlaneGeometry(0.25, 0.08), bluM, 0, -0.1, 0.12, 0.5);
  } else if (kind === 'Parker') {
    // the white-faced heat shield points at the Sun (+z), instruments in its shadow
    add(new THREE.CylinderGeometry(0.16, 0.16, 0.025, 6), new THREE.MeshStandardMaterial({ color: 0xf4f2ee, roughness: 0.7 }), 0, 0, 0.12, Math.PI/2);
    add(new THREE.CylinderGeometry(0.155, 0.155, 0.012, 6), dark, 0, 0, 0.1, Math.PI/2);
    add(new THREE.CylinderGeometry(0.07, 0.09, 0.16, 6), foil, 0, 0, 0.0, Math.PI/2);
    [1, -1].forEach(sd => add(new THREE.PlaneGeometry(0.05, 0.1), bluM, sd*0.12, 0, -0.02, 0, 0, 0));
    add(new THREE.CylinderGeometry(0.004, 0.004, 0.3, 6), metal, 0, 0, -0.2, Math.PI/2);
  } else {
    // Voyager: big white dish toward Earth (+z), decagon bus, RTG boom, magnetometer boom
    const dish = []; for (let k = 0; k <= 14; k++) { const r = k/14*0.19; dish.push(V2(r, -r*r*1.6)); }
    const d = add(new THREE.LatheGeometry(dish, 32), new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: 0.5, metalness: 0.1, side: THREE.DoubleSide }), 0, 0, 0.07, -Math.PI/2);
    add(new THREE.CylinderGeometry(0.008, 0.008, 0.08, 6), metal, 0, 0, 0.1, Math.PI/2);
    add(new THREE.CylinderGeometry(0.075, 0.075, 0.05, 10), foil, 0, 0, -0.02, Math.PI/2);
    const boom = (x, y, z, len) => { const v = new THREE.Vector3(x, y, z).normalize(), t = add(new THREE.CylinderGeometry(0.003, 0.003, len, 5), metal); t.position.copy(v.clone().multiplyScalar(len/2)).add(new THREE.Vector3(0, 0, -0.03)); t.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v); return v; };
    const rv = boom(-1, -0.2, -0.3, 0.3); [0.12, 0.18, 0.24].forEach(k => { const c = add(new THREE.CylinderGeometry(0.018, 0.018, 0.05, 8), dark); c.position.copy(rv.clone().multiplyScalar(k)).add(new THREE.Vector3(0, 0, -0.03)); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), rv); });
    boom(1, 0.1, -0.4, 0.55); const sc = boom(0.6, -0.5, -0.4, 0.2); const pl = add(new THREE.BoxGeometry(0.04, 0.04, 0.03), dark); pl.position.copy(sc.multiplyScalar(0.2)).add(new THREE.Vector3(0, 0, -0.03));
    const rec = add(new THREE.CircleGeometry(0.02, 16), new THREE.MeshStandardMaterial({ color: 0xd4a840, metalness: 1, roughness: 0.25 }), 0.077, 0, -0.02, 0, Math.PI/2);
  }
  // drawn a little larger than true scale next to the shuttle, so they read on screen
  g.scale.setScalar(kind === 'JWST' ? 1.6 : 2); return g;
}

function rockGeo(seed) {
  const g = new THREE.IcosahedronGeometry(1, 1), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 0.72 + 0.5*noise3(x*1.7 + seed, y*1.7, z*1.7); p.setXYZ(i, x*k, y*k*0.85, z*k); }
  g.computeVertexNormals(); return g;
}

function buildSolar() {
  G.glintTex = glowTex([[0, 'rgba(255,255,255,1)'], [0.12, 'rgba(255,255,255,.75)'], [0.35, 'rgba(255,255,255,.12)'], [1, 'rgba(255,255,255,0)']]);
  const grp = new THREE.Group(), bodies = [];
  const sun = starBody(70, '#fff1c2', '#ff9a2e', 4.5); grp.add(sun); bodies.push({ id: 'Sun', obj: sun, r: 70, star: true });
  const date = new Date();
  PLANETS.forEach(p => {
    let v = null; try { v = G.helio(p.id, date); } catch (e) {}
    const dir = v ? ecl2game(v).normalize() : new THREE.Vector3(Math.cos(p.orbit), 0, Math.sin(p.orbit));
    const m = planetMesh(p, G.tex[p.tex]); m.position.copy(dir.multiplyScalar(p.orbit)); grp.add(m);
    const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: G.glintTex, color: new THREE.Color().setRGB(...(p.atm || [0.85, 0.85, 0.85])).lerp(new THREE.Color(1, 1, 1), 0.5), sizeAttenuation: false, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    gl.scale.setScalar(p.r > 30 ? 0.03 : p.r > 12 ? 0.024 : 0.017); m.add(gl);
    bodies.push({ id: p.id, obj: m, r: p.r, p, glint: gl });
    // faint orbit ring
    const pts = []; for (let k = 0; k <= 256; k++) { const a = k/256*Math.PI*2; pts.push(new THREE.Vector3(Math.cos(a)*p.orbit, 0, Math.sin(a)*p.orbit)); }
    const ol = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: p.id === 'Earth' ? 0x6fb3ff : 0xe3c27e, transparent: true, opacity: p.id === 'Earth' ? 0.22 : 0.1, depthWrite: false }));
    grp.add(ol);
    if (p.id === 'Earth') {
      [['ISS', 19.5, 0.09, 0.9], ['Tiangong', 21, 0.075, -0.6]].forEach(([id, rad, w, inc]) => { const st = makeStation(id); grp.add(st);
        bodies.push({ id, obj: st, r: 0.8, small: true, orbit: { c: m, rad, w, inc, a: Math.random()*6.28 } }); });
    }
    if (p.id === 'Earth') { const moon = planetMesh({ id: 'Moon', r: 3.8, tilt: 0 }, G.tex.moon); moon.position.copy(m.position).add(new THREE.Vector3(46, 4, 0)); grp.add(moon); bodies.push({ id: 'Moon', obj: moon, r: 3.8, moonOf: m }); }
  });
  // big moons on their own orbits (game distances), and Phobos as a small rock
  const MOONS = [['Phobos', 'Mars', 15, 0.9, 0.5, 0.02, 'rock'], ['Io', 'Jupiter', 72, 4, 0.12, 0.02, 'io'], ['Europa', 'Jupiter', 92, 3.6, 0.09, 0.03, 'europa'], ['Ganymede', 'Jupiter', 118, 5.5, 0.06, 0.02, 'ganymede'],
    ['Callisto', 'Jupiter', 152, 5, 0.04, 0.03, 'callisto'], ['Enceladus', 'Saturn', 98, 1.6, 0.1, 0.0, 'enceladus'], ['Titan', 'Saturn', 160, 5.5, 0.04, 0.02, 'titan'], ['Triton', 'Neptune', 46, 2.8, -0.06, 0.4, 'triton']];
  MOONS.forEach(([id, par, rad, r, w, inc, tex]) => { const pb = bodies.find(b => b.id === par); if (!pb) return;
    const mp = { id, r, tilt: 0, tex, day: 2, atm: id === 'Titan' ? [1.0, 0.65, 0.3] : null }, m = planetMesh(mp, G.tex[tex]); grp.add(m);
    if (id === 'Phobos') m.userData.body.scale.set(1.25, 0.8, 0.95);
    bodies.push({ id, obj: m, r, p: mp, parent: par, orbit: { c: pb.obj, rad, w, inc: inc + (pb.p.tilt || 0)*D2R*0.3, a: Math.random()*6.28 } }); });
  // spacecraft: Hubble in low orbit, Webb at L2 beyond the Moon, Parker on a tight loop round the Sun, the Voyagers far out in their real directions
  const earthB = bodies.find(b => b.id === 'Earth'), earthP = earthB.obj.position;
  const hub = makeCraft('Hubble'); grp.add(hub); bodies.push({ id: 'Hubble', obj: hub, r: 0.6, small: true, orbit: { c: earthB.obj, rad: 17.6, w: 0.11, inc: 0.5, a: 2 } });
  const l2 = new THREE.Object3D(); l2.position.copy(earthP).add(earthP.clone().normalize().multiplyScalar(150)); grp.add(l2);
  const jw = makeCraft('JWST'); grp.add(jw); bodies.push({ id: 'JWST', obj: jw, r: 0.7, small: true, orbit: { c: l2, rad: 9, w: 0.03, inc: 1.2, a: 0, face: 'sun' } });
  const pk = makeCraft('Parker'); grp.add(pk); bodies.push({ id: 'Parker', obj: pk, r: 0.5, small: true, kepler: { q: 135, Q: 610, th: 2.5, tilt: 0.06 } });
  [['Voyager1', 258.6, 12.1, 9400], ['Voyager2', 301, -60, 8700]].forEach(([id, ra, dec, R]) => { const v = makeCraft('Voyager'); v.position.copy(eq2game(eqv(ra, dec)).multiplyScalar(R)); v.lookAt(earthP); grp.add(v); bodies.push({ id, obj: v, r: 0.6, small: true }); });
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

/* ---------------- the shuttle ---------------- */
// built at 10x and scaled down: nose toward -Z, about 6.4 units long before scaling
// the orbiter's paint: white tiles on top, black heat tiles on the belly and nose, cockpit windows, payload bay seams
function shuttlePaint() {
  const W = 1024, H = 512, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  g.fillStyle = '#efece5'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 2600; i++) { const x = Math.random()*W, y = Math.random()*H, v = 222 + Math.random()*22; g.fillStyle = 'rgb(' + v + ',' + (v - 2) + ',' + (v - 7) + ')'; g.fillRect(Math.floor(x/12)*12, Math.floor(y/12)*12, 12, 12); }
  g.strokeStyle = 'rgba(120,118,112,.35)'; g.lineWidth = 1; for (let x = 0; x <= W; x += 12) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y <= H; y += 12) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  // belly: black tiles over the lower ~40%, curving up toward the nose (the "chine")
  g.fillStyle = '#17181c'; g.beginPath();
  for (let y = 0; y <= H; y += 4) { const v = y/H, up = v < 0.22 ? (0.22 - v)*0.55 : 0; g.lineTo(W*(0.31 - up), y); }
  for (let y = H; y >= 0; y -= 4) { const v = y/H, up = v < 0.22 ? (0.22 - v)*0.55 : 0; g.lineTo(W*(0.69 + up), y); }
  g.closePath(); g.fill();
  g.fillRect(0, 0, W, H*0.035);
  g.strokeStyle = 'rgba(60,62,70,.6)'; for (let x = W*0.2; x <= W*0.8; x += 10) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y <= H; y += 10) { g.beginPath(); g.moveTo(W*0.25, y); g.lineTo(W*0.75, y); g.stroke(); }
  // cockpit: dark frame with six window panes on top, near the nose
  const wy = H*0.115, wh = H*0.05; g.fillStyle = '#1b1c21'; g.fillRect(0, wy - 6, W*0.1, wh + 12); g.fillRect(W*0.9, wy - 6, W*0.1, wh + 12);
  g.fillStyle = '#3a4a5c'; [[0.005, 0.03], [0.035, 0.03], [0.065, 0.028], [0.905, 0.028], [0.935, 0.03], [0.965, 0.03]].forEach(([u, w]) => g.fillRect(W*u, wy, W*w, wh));
  // payload bay doors: centre seam, hinge lines and frame joints
  g.strokeStyle = 'rgba(80,80,78,.8)'; g.lineWidth = 2; [0, W - 1, W*0.075, W*0.925].forEach(x => { g.beginPath(); g.moveTo(x, H*0.27); g.lineTo(x, H*0.87); g.stroke(); });
  g.lineWidth = 1; for (let y = H*0.27; y <= H*0.87; y += H*0.06) { g.beginPath(); g.moveTo(0, y); g.lineTo(W*0.075, y); g.moveTo(W*0.925, y); g.lineTo(W, y); g.stroke(); }
  // thin dark stripe along the sides and a few red/blue marking dots like the real paint scheme
  g.fillStyle = '#26272c'; g.fillRect(W*0.24, H*0.3, W*0.012, H*0.55); g.fillRect(W*0.748, H*0.3, W*0.012, H*0.55);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; return t;
}
function makeShuttle() {
  const g = new THREE.Group(), V2 = (x, y) => new THREE.Vector2(x, y);
  const tc = document.createElement('canvas'); tc.width = tc.height = 128; const tg = tc.getContext('2d'); tg.fillStyle = '#f1ede4'; tg.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 16) for (let x = 0; x < 128; x += 16) { const v = 228 + Math.random()*20; tg.fillStyle = 'rgb(' + v + ',' + (v - 2) + ',' + (v - 7) + ')'; tg.fillRect(x, y, 16, 16); }
  tg.strokeStyle = 'rgba(110,108,100,.45)'; for (let k = 0; k <= 128; k += 16) { tg.beginPath(); tg.moveTo(k, 0); tg.lineTo(k, 128); tg.moveTo(0, k); tg.lineTo(128, k); tg.stroke(); }
  const tileT = new THREE.CanvasTexture(tc); tileT.encoding = THREE.sRGBEncoding; tileT.wrapS = tileT.wrapT = THREE.RepeatWrapping; tileT.repeat.set(2.2, 2.2);
  const white = new THREE.MeshStandardMaterial({ color: 0xffffff, map: tileT, roughness: 0.55, metalness: 0.06 });
  const tile = new THREE.MeshStandardMaterial({ color: 0x1d1e23, roughness: 0.75 });
  const grey = new THREE.MeshStandardMaterial({ color: 0x9a9ca3, roughness: 0.45, metalness: 0.5, side: THREE.DoubleSide });
  // fuselage: evenly spaced profile (tail first, so the faces point outward); the paint map's top row is the nose, u=0 the top, u=0.5 the belly
  const prof = []; for (let k = 0; k <= 48; k++) { const y = 3.25 - k/48*5.95; let r = y > 0.9 ? 0.64*Math.sqrt(Math.max(0, 1 - Math.pow((y - 0.9)/2.35, 2))) : y < -2.45 ? 0.64 - (-2.45 - y)*0.16 : 0.64; prof.push(V2(Math.max(r, k ? 0.001 : 0), y)); } prof.reverse();
  const fus = new THREE.Mesh(new THREE.LatheGeometry(prof, 48), new THREE.MeshStandardMaterial({ map: shuttlePaint(), roughness: 0.6, metalness: 0.05 }));
  fus.rotation.x = -Math.PI/2; fus.scale.set(1, 1, 0.82); g.add(fus);
  const aft = new THREE.Mesh(new THREE.CircleGeometry(0.6, 36), tile); aft.position.z = 2.69; aft.scale.set(1, 0.82, 1); g.add(aft);
  // delta wings with black heat-tile undersides
  const ws = new THREE.Shape([V2(0.45, -1.4), V2(0.75, -0.4), V2(2.35, 1.75), V2(2.35, 2.3), V2(0.45, 2.45)]);
  const rcc = new THREE.MeshStandardMaterial({ color: 0x2b2d33, roughness: 0.55, metalness: 0.15 }), elev = new THREE.MeshStandardMaterial({ color: 0xc9c6bf, roughness: 0.6 });
  // a dark strip from a to b (x, y, z), like the carbon leading edges
  const strip = (a, b, r, m) => { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 10), m);
    c.position.copy(A).add(B).multiplyScalar(0.5); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); g.add(c); };
  [1, -1].forEach(side => {
    const wg = new THREE.ExtrudeGeometry(ws, { depth: 0.09, bevelEnabled: false });
    const w = new THREE.Mesh(wg, white); w.rotation.x = Math.PI/2; w.scale.x = side; w.position.y = -0.18; g.add(w);
    const u = new THREE.Mesh(wg, tile); u.rotation.x = Math.PI/2; u.scale.set(side, 1, 0.3); u.position.y = -0.27; g.add(u);
    strip([side*0.45, -0.225, -1.4], [side*0.75, -0.225, -0.4], 0.06, rcc); strip([side*0.75, -0.225, -0.4], [side*2.35, -0.225, 1.75], 0.055, rcc);
    const ev = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.1, 0.22), elev); ev.position.set(side*1.4, -0.22, 2.3); g.add(ev);
    const oms = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 1.4, 16), white); oms.rotation.x = Math.PI/2; oms.position.set(side*0.42, 0.42, 1.95); g.add(oms);
    const omsCap = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 10, 0, Math.PI*2, 0, Math.PI/2), tile); omsCap.rotation.x = -Math.PI/2; omsCap.position.set(side*0.42, 0.42, 1.25); omsCap.scale.set(1, 1.6, 1); g.add(omsCap);
    const omsN = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 0.18, 12, 1, true), grey); omsN.rotation.x = Math.PI/2; omsN.position.set(side*0.42, 0.44, 2.72); g.add(omsN);
  });
  [1, -1].forEach(sd => { const r = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.22), tile); r.position.set(sd*0.42, 0.12, -2.55); g.add(r); });
  const fin = new THREE.Mesh(new THREE.ExtrudeGeometry(new THREE.Shape([V2(0.9, 0.5), V2(2.55, 0.5), V2(2.7, 2.15), V2(2.2, 2.15)]), { depth: 0.08, bevelEnabled: false }), white);
  fin.rotation.y = -Math.PI/2; fin.position.x = 0.04; g.add(fin);
  strip([0, 0.5, 0.9], [0, 2.15, 2.2], 0.05, rcc);
  const rud = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.45, 0.05), elev); rud.position.set(0, 1.35, 2.5); rud.rotation.x = 0.09; g.add(rud);
  const bf = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.4), tile); bf.position.set(0, -0.32, 2.85); g.add(bf);
  // three main engines with flames whose length follows the thrust
  const flames = [], fGlow = glowTex([[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(160,200,255,.7)'], [1, 'rgba(90,140,255,0)']]);
  [[0, 0.22], [-0.3, -0.14], [0.3, -0.14]].forEach(([x, y]) => {
    const bp = []; for (let k = 0; k <= 12; k++) { const t = k/12; bp.push(V2(0.11 + 0.15*Math.pow(t, 1.6), -t*0.46)); }
    const bell = new THREE.Mesh(new THREE.LatheGeometry(bp, 24), grey); bell.rotation.x = -Math.PI/2; bell.position.set(x, y, 2.66); g.add(bell);
    const throat = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.12, 16), tile); throat.rotation.x = Math.PI/2; throat.position.set(x, y, 2.62); g.add(throat);
    const fl = new THREE.Group(); fl.position.set(x, y, 3.05); g.add(fl);
    const outer = new THREE.Mesh(new THREE.ConeGeometry(0.24, 1, 18, 1, true), new THREE.MeshBasicMaterial({ color: 0x6f9dff, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    outer.rotation.x = Math.PI/2; outer.position.z = 0.5; fl.add(outer);
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.6, 14, 1, true), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    inner.rotation.x = Math.PI/2; inner.position.z = 0.3; fl.add(inner);
    const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: fGlow, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); gl.scale.setScalar(0.9); gl.position.z = 0.05; fl.add(gl);
    flames.push({ fl, gl });
  });
  const model = new THREE.Group(); model.add(g); model.scale.setScalar(0.1);
  return { model, flames };
}

/* ---------------- game ---------------- */
function init(opts) {
  const el = buildDom(), $ = id => el.querySelector('#' + id);
  const renderer = new THREE.WebGLRenderer({ canvas: $('gk3'), antialias: true, powerPreference: 'high-performance' });
  const pr = Math.min(window.devicePixelRatio || 1, 2); renderer.setPixelRatio(pr);
  renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(70, 1, 0.3, 120000);
  const ship = new THREE.Object3D(); scene.add(ship);
  renderer.autoClear = false;
  // the shuttle lives in its own little scene, drawn after the world with a near camera so it never clips
  const shipScene = new THREE.Scene(), shipCam = new THREE.PerspectiveCamera(70, 1, 0.01, 50), shut = makeShuttle(); shipScene.add(shut.model);
  const shipSun = new THREE.DirectionalLight(0xfff4e6, 2.4); shipScene.add(shipSun); shipScene.add(new THREE.AmbientLight(0x56607a, 0.55));
  G = Object.assign(G || {}, { sunV: { value: new THREE.Vector3(1, 0, 0) }, hiQ: [], task: null, el, $, renderer, scene, camera, ship, pr, helio: opts.helio, tex: {}, shipScene, shipCam, shut, shipSun, view: 'chase', camQ: new THREE.Quaternion(), orb: { y: 0, p: 0 }, bank: 0, pitchV: 0 });
  // textures (procedural, painted once)
  Object.keys(TEX).forEach(k => { const [w, h, fn] = TEX[k]; G.tex[k] = paint(w, h, fn); });
  const sky = makeStarSphere(opts.stars); scene.add(sky); G.sky = sky;
  scene.add(new THREE.AmbientLight(0x404a66, 0.13));
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
  $('gkView').onclick = () => setView(G.view === 'chase' ? 'cockpit' : 'chase'); setView('chase');
  $('gkDock').onclick = dock;
  G.mapMode = 'sys'; G.trail = []; bindBig();
  $('gkX').onclick = close; $('gkList').onclick = openList; $('gkAuto').onclick = () => setAuto(!G.auto);
  $('gkStop').onclick = () => { setAuto(false); setThr(0); };
  updateCount();
}
function placeAtEarth() {
  const e = G.sol.bodies.find(b => b.id === 'Earth').obj.position, out = e.clone().normalize();
  const side = new THREE.Vector3().crossVectors(out, new THREE.Vector3(0, 1, 0)).normalize();
  G.ship.position.copy(e).add(out.clone().multiplyScalar(-14*3.2)).add(side.multiplyScalar(14*2.2)).add(new THREE.Vector3(0, 9, 0));
  const m = new THREE.Matrix4().lookAt(G.ship.position, e.clone().add(new THREE.Vector3(30, 0, 0)), new THREE.Vector3(0, 1, 0)); G.ship.quaternion.setFromRotationMatrix(m); G.camQ.copy(G.ship.quaternion);
  G.speed = 0; G.thr = 0; G.near = new Set(['Earth']);
}

function resize() {
  const w = innerWidth, h = innerHeight; G.renderer.setSize(w, h, false); G.camera.aspect = w/h; G.camera.updateProjectionMatrix(); G.shipCam.aspect = w/h;
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
    if (down && k === 'escape') { if (G.big) closeBig(); else if (G.card) hideCard(); else close(); }
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'a', 'd', 'q', 'e'].includes(k) && down) setAuto(false);
    if (k === 'shift') { G.turbo = down; turbo.classList.toggle('on', down); if (down) setAuto(false); }
  };
  window.addEventListener('keydown', G.onKey); window.addEventListener('keyup', G.onKey);
}
function setView(v) {
  G.view = v; G.$('gkView').textContent = v === 'chase' ? L('Kokpit', 'Cockpit') : L('Dış görünüm', 'Outside');
  G.el.querySelector('.cock').style.display = v === 'chase' ? 'none' : '';
}
function setThr(v) { if (v > 0.01) { if (G.dock && G.dock.done) undock(); else if (G.dock) return; G.hold = null; } G.thr = Math.max(0, Math.min(1, v)); G.$('gkThr').lastChild.style.height = 'calc(' + (G.thr*100).toFixed(1) + '% - 8px)'; if (G.thr < 0.01) G.$('gkThr').lastChild.style.height = '0'; }
function setAuto(v) { if (v && !G.target) { openList(); return; } if (v && G.dock) { if (!G.dock.done) return; undock(); } if (v) G.hold = null; G.auto = v; G.$('gkAuto').classList.toggle('on', v); if (v) { hideCard(); hint(''); } }
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
  const item = id => '<button class="b' + (PROG.found[id] ? ' got' : '') + (G.target === id ? ' cur' : '') + '" data-id="' + id + '"><b>' + (PROG.found[id] ? '★ ' : '') + nm(id) + '</b><small>' + tx2(INFO[id].k) + '</small></button>';
  const items = CATS.map(([t, ids]) => '<div class="gkcat">' + tx2(t) + '</div>' + ids.map(item).join('')).join('');
  showCard('<div class="kk">' + L('Görev listesi', 'Mission list') + ' · ' + Object.keys(PROG.found).length + '/' + ORDER.length + ' ' + L('keşif', 'discovered') + '</div><h3>' + L('Nereye gidelim?', 'Where to?') + '</h3>' +
    '<div class="st">' + L('Gezegenler bu anki gerçek konumlarında. Yıldızlara hiper sürüşle gidilir.', 'Planets are in their real positions right now. Stars are reached by hyperdrive.') + '</div><div class="gklist">' + items + '</div><div class="gkrow" style="margin-top:12px"><button class="b" data-close>' + L('Kapat', 'Close') + '</button></div>', true);
  G.$('gkCard').querySelectorAll('[data-id]').forEach(b => b.onclick = () => { setTarget(b.dataset.id); setAuto(true); });
}
function showCard(html, modal) { const c = G.$('gkCard'); c.innerHTML = html; c.classList.add('show'); G.card = { modal }; const x = c.querySelector('[data-close]'); if (x) x.onclick = hideCard; }
function hideCard() { G.$('gkCard').classList.remove('show'); G.card = null; }

function realLine(id) {
  const loc = LANG === 'en' ? 'en' : 'tr';
  if (isStarDest(id)) return L('Işık bile buraya ', 'Even light needs ') + STARSYS[id].ly.toLocaleString(loc) + L(' yılda ulaşır. Arkandaki parlak nokta: Güneş.', ' years to get here. The bright dot behind you: the Sun.');
  if (id === 'Earth') return '';
  if (id === 'Moon') return L('Işığın Ay\'dan Dünya\'ya gelmesi 1,3 saniye sürer.', 'Light takes 1.3 seconds to travel from the Moon to Earth.');
  try { const now = new Date(), e = G.helio('Earth', now), p = id === 'Sun' ? [0, 0, 0] : G.helio(id, now), d = Math.hypot(p[0] - e[0], p[1] - e[1], p[2] - e[2]), km = d*149.6, lm = d*8.317;
    return L('Bugün Dünya\'dan uzaklığı: ', 'Distance from Earth today: ') + (km >= 1000 ? (km/1000).toLocaleString(loc, { maximumFractionDigits: 2 }) + L(' milyar km', ' billion km') : Math.round(km).toLocaleString(loc) + L(' milyon km', ' million km')) +
      ' · ' + L('ışık bu yolu ', 'light covers it in ') + (lm >= 60 ? (lm/60).toLocaleString(loc, { maximumFractionDigits: 1 }) + L(' saatte alır', ' hours') : Math.round(lm) + L(' dakikada alır', ' minutes'));
  } catch (e) { return ''; }
}
// arrival: a small chip that leaves the view free; tapping it opens the full card
function discover(id) {
  const first = !PROG.found[id]; if (first) { PROG.found[id] = Date.now(); save(); updateCount(); }
  const I = INFO[id], chip = G.$('gkChip');
  chip.innerHTML = '<b>' + (first ? '★ ' : '') + nm(id) + '</b><span>' + tx2(I.f[0]) + '</span><i>' + L('Detay', 'More') + ' ›</i>';
  chip.classList.remove('show'); void chip.offsetWidth; chip.classList.add('show'); chip.onclick = () => details(id);
  clearTimeout(G.chipT); G.chipT = setTimeout(() => chip.classList.remove('show'), 9000);
  if (first) { bigMsg(L('Keşfedildi!', 'Discovered!'), nm(id), 1400); flash('radial-gradient(circle, rgba(227,194,126,.3), rgba(227,194,126,0) 70%)', 1); }
}
function details(id) {
  const I = INFO[id], real = realLine(id); G.$('gkChip').classList.remove('show');
  showCard('<div class="kk">' + tx2(I.k) + '</div><h3>' + nm(id) + '</h3><ul>' + I.f.map(f => '<li>' + tx2(f) + '</li>').join('') + '</ul><div class="st">' + tx2(I.s) + (real ? '<br>' + real : '') + '</div>' +
    '<div class="gkrow"><button class="b on" id="gkNext">' + L('Sonraki hedef', 'Next target') + '</button><button class="b" data-close>' + L('Kapat', 'Close') + '</button></div>', false);
  G.$('gkNext').onclick = () => { const nx = ORDER.find(x => !PROG.found[x]) || ORDER[(ORDER.indexOf(id) + 1) % ORDER.length]; setTarget(nx); setAuto(true); };
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
  G.trail = [];
  if (G.sys) { G.scene.remove(G.sys.grp); G.sys = null; }
  if (to === 'sol') {
    G.sol.grp.visible = true; G.sunLight.position.set(0, 0, 0); G.sunMark.visible = false; G.mode = 'sol';
    const e = G.sol.bodies.find(b => b.id === 'Sun'); G.ship.position.set(0, 200, 0).add(eq2game(eqv(STARSYS[G.warp.fromSys].ra, STARSYS[G.warp.fromSys].dec)).multiplyScalar(600));
    const m = new THREE.Matrix4().lookAt(G.ship.position, e.obj.position, new THREE.Vector3(0, 1, 0)); G.ship.quaternion.setFromRotationMatrix(m); G.camQ.copy(G.ship.quaternion);
  } else {
    G.sol.grp.visible = false; G.sys = buildSystem(to); G.scene.add(G.sys.grp); G.mode = to; G.sunLight.position.set(0, 0, 0);
    const dir = eq2game(eqv(STARSYS[to].ra, STARSYS[to].dec)), main = G.sys.bodies[0];
    G.ship.position.copy(dir.clone().multiplyScalar(-main.r*9)).add(new THREE.Vector3(0, main.r*1.5, 0));
    const m = new THREE.Matrix4().lookAt(G.ship.position, new THREE.Vector3(), new THREE.Vector3(0, 1, 0)); G.ship.quaternion.setFromRotationMatrix(m); G.camQ.copy(G.ship.quaternion);
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
    // parked (no thrust, no autopilot): steering swings the camera around the shuttle instead, to look at the view
    const parked = G.thr < 0.01 && !G.auto && !G.turbo && G.speed < 3 && G.view === 'chase';
    if (parked) { G.orb.y += yaw*1.5*dt; G.orb.p = Math.max(-1.3, Math.min(1.3, G.orb.p + pitch*1.2*dt));
      if ((yaw || pitch) && !G.orbHint) { G.orbHint = true; hint(L('Mekik dururken sürükle: etrafında dön ve manzaraya bak. Gaz verince yeniden sürersin.', 'While parked, drag to swing around the shuttle and enjoy the view. Add thrust to fly again.')); } }
    else { const k = Math.min(1, dt*1.8); G.orb.y -= G.orb.y*k; G.orb.p -= G.orb.p*k;
      const rate = 1.1; ship.rotateY(yaw*rate*dt); ship.rotateX(pitch*rate*dt); ship.rotateZ(roll*1.6*dt); }
  }
  // autopilot / speed
  const bodies = G.mode === 'sol' ? G.sol.bodies : G.sys.bodies;
  let want = G.thr*90 + (G.turbo ? 420 : 0);
  const tb = G.target ? bodyById(G.target) : null;
  if (G.auto && !G.warp) {
    const needWarp = isStarDest(G.target) ? G.mode !== G.target : G.mode !== 'sol';
    let aimPos;
    if (needWarp) { const dirTo = G.mode === 'sol' ? eq2game(eqv(STARSYS[G.target].ra, STARSYS[G.target].dec)) : G.sunDir.clone(); aimPos = ship.position.clone().add(dirTo.multiplyScalar(10000)); }
    else {
      aimPos = worldPos(tb);
      // a planet in the way: aim past its limb first, then on to the target
      for (const b of bodies) { if (b === tb) continue; const c = worldPos(b), R = b.r*(b.star ? 1.6 : 1.25) + 2, to = aimPos.clone().sub(ship.position), L2 = to.lengthSq();
        const t = Math.max(0, Math.min(1, c.clone().sub(ship.position).dot(to)/L2)), cp = ship.position.clone().addScaledVector(to, t);
        if (t > 0 && t < 1 && cp.distanceTo(c) < R && c.distanceTo(aimPos) > R) { let off = cp.clone().sub(c); if (off.lengthSq() < 1e-6) off = up.clone(); aimPos = c.clone().add(off.normalize().multiplyScalar(R*1.35)); break; } }
    }
    const m = new THREE.Matrix4().lookAt(ship.position, aimPos, up), qt = new THREE.Quaternion().setFromRotationMatrix(m), ang = q.angleTo(qt);
    q.rotateTowards(qt, dt*(0.9 + ang*0.6));
    if (needWarp) { want = ang < 0.12 ? 60 : 0; if (ang < 0.05) startWarp(G.mode === 'sol' ? G.target : 'sol'); }
    else { const d = ship.position.distanceTo(worldPos(tb)) - (tb.small ? 2.4 : tb.r*(tb.star ? 4 : tb.p && tb.p.ring ? 4.6 : 3.4) + 8); want = ang > 0.6 ? 15 : Math.max(0, Math.min(520, Math.sqrt(Math.max(0, d)*2*260)));
      if (d < (tb.small ? 0.4 : 6)) { setAuto(false); setThr(0); want = 0; G.speed *= 0.3;
        if (tb.small) { G.hold = tb; hint(DOCK[tb.id] ? L(nm(tb.id) + ' ile birlikte yörüngedesin. Kenetlen\'e basarak bağlanabilirsin.', 'You are flying alongside ' + nm(tb.id) + '. Tap Dock to connect.')
          : L(nm(tb.id) + ' yanındasın. Mekik dururken sürükleyerek etrafından bak.', 'You are next to ' + nm(tb.id) + '. While parked, drag to look around it.')); } } }
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
  // every body has a hard shell just above its surface; flying at it slows the shuttle so you can hover close and look
  const shell = b => b.r*(b.star ? 1.45 : 1.04) + (b.star ? 0 : Math.max(0.6, b.r*0.03));
  if (!G.warp) bodies.forEach(b => { if (G.dock && G.dock.b === b) return; const c = worldPos(b), oc = c.clone().sub(ship.position), along = oc.dot(fwd); if (along <= 0) return;
    const R = shell(b), perp2 = oc.lengthSq() - along*along; if (perp2 > R*R*1.3) return;
    const gap = along - Math.sqrt(Math.max(0, R*R - perp2)); G.speed = Math.min(G.speed, Math.max(1.5, gap*2.2)); });
  const vel = fwd.clone().multiplyScalar(G.speed); G.vel.copy(vel);
  const prev = ship.position.clone();
  ship.position.addScaledVector(vel, dt);
  bodies.forEach(b => { if (G.dock && G.dock.b === b) return; const c = worldPos(b), R = shell(b), seg = ship.position.clone().sub(prev), segLen = seg.length();
    if (prev.distanceTo(c) < R) { ship.position.copy(c).add(prev.clone().sub(c).normalize().multiplyScalar(R)); return; }
    if (segLen < 1e-6) return; const dir = seg.divideScalar(segLen), oc = prev.clone().sub(c), bb = oc.dot(dir), cc = oc.lengthSq() - R*R, disc = bb*bb - cc;
    if (disc < 0) return; const t = -bb - Math.sqrt(disc); if (t < 0 || t > segLen) return;
    ship.position.copy(prev).addScaledVector(dir, Math.max(0, t - 0.05)); G.speed = Math.min(G.speed, 1.5);
    if (!G.edgeT || G.time - G.edgeT > 6) { G.edgeT = G.time; hint(L('Yüzeye en yakın noktadasın; dönüp çevresinde gezebilirsin.', 'This is as close as you can get; turn and fly around it.')); } });
  // animate
  const sunMat = G.mode === 'sol' ? G.sol.sun.userData.mat : (G.sys.bodies[0].obj.userData.mat); sunMat.uniforms.uT.value = G.time;
  if (G.mode === 'sol') {
    G.sol.bodies.forEach(b => { if (b.p) { b.obj.userData.body.rotation.y += dt*0.25/(b.p.day || 1)*0.4; if (b.obj.userData.clouds) b.obj.userData.clouds.rotation.y += dt*0.012;
      if (b.obj.userData.atm) b.obj.userData.atm.material.uniforms.uSun.value.copy(b.obj.position).negate().normalize(); } });
    G.sol.bodies.forEach(b => { if (!b.orbit && !b.kepler) return; const old = b.obj.position.clone();
      if (b.kepler) { // Parker: an ellipse with the Sun at one focus, fast at perihelion
        const k = b.kepler, a = (k.q + k.Q)/2, e = (k.Q - k.q)/(k.Q + k.q), rr = a*(1 - e*e)/(1 + e*Math.cos(k.th)); k.th += dt*26000/(rr*rr);
        b.obj.position.set(Math.cos(k.th)*rr, Math.sin(k.th)*rr*k.tilt, Math.sin(k.th)*rr); b.obj.lookAt(0, 0, 0); }
      else { const o = b.orbit; o.a += o.w*dt;
        const v = new THREE.Vector3(Math.cos(o.a)*o.rad, 0, Math.sin(o.a)*o.rad).applyAxisAngle(new THREE.Vector3(1, 0, 0), o.inc);
        b.obj.position.copy(o.c.position).add(v);
        if (o.face === 'sun') { b.obj.lookAt(0, 0, 0); } else if (b.small) { b.obj.lookAt(o.c.position); b.obj.rotateY(Math.PI/2); } }
      const delta = b.obj.position.clone().sub(old); if (G.hold === b && !G.dock) ship.position.add(delta); if (G.dock && G.dock.b === b) G.dock.p0.add(delta); });
    updateDock(dt);
    G.sol.belt.rotation.y += dt*0.004;
    const hpx = innerHeight/(2*Math.tan(G.camera.fov*D2R/2));
    G.sol.bodies.forEach(b => { if (b.star) return; const d = worldPos(b).distanceTo(ship.position); if (d < b.r*16) requestHi(b);
      if (b.glint) { const pxr = b.r/Math.max(1, d)*hpx; b.glint.material.opacity = Math.max(0, Math.min(1, (3.5 - pxr)/2.5)); } });
    const earth = G.sol.bodies.find(b => b.id === 'Earth').obj; G.sunV.value.copy(earth.position).negate().normalize().transformDirection(G.camera.matrixWorldInverse);
    runPaintJobs(G.mobile ? 5 : 7);
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
  G.trailT = (G.trailT || 0) + dt; if (G.trailT > 0.25 && !G.warp) { G.trailT = 0; const lt = G.trail[G.trail.length - 1]; if (!lt || lt.distanceTo(ship.position) > 0.5) { G.trail.push(ship.position.clone()); if (G.trail.length > 700) G.trail.shift(); } }
  updateDust(G.dust, ship.position, G.warp ? vel.clone().multiplyScalar(0.5) : vel, !!G.warp);
  G.sky.position.copy(ship.position);
  G.sky.userData.mats.forEach(m => { m.uniforms.uPx.value = G.pr; });
  const att = innerHeight*G.pr/(2*Math.tan(G.camera.fov*D2R/2));
  [G.sol.comet.mat].concat(G.met.list.map(o => o.trail.material)).forEach(m => { m.uniforms.uAtt.value = att; m.uniforms.uPx.value = G.pr; });
  if (G.sys && G.sys.grp.userData.disk) G.sys.grp.userData.disk.material.uniforms.uAtt.value = att;
  // shield regen, shake
  G.shield = Math.min(100, G.shield + dt*4);
  G.shake = Math.max(0, G.shake - dt*1.4) ; const sk = G.shake*G.shake;
  placeCamera(dt, sk);
  if (G.speed > 300 && !G.warp) G.shake = Math.max(G.shake, 0.22);
  // discoveries by proximity
  // each body triggers once per visit; a body passed while another card is open is logged quietly
  if (!G.warp) bodies.forEach(b => { const d = worldPos(b).distanceTo(ship.position) - b.r; const lim = b.small ? 6 : b.r*(b.star ? 3.2 : 3.8) + 18;
    if (d < lim && !G.near.has(b.id)) { const isT = G.target === b.id;
      if (G.card && !isT) { G.near.add(b.id); if (!PROG.found[b.id]) { PROG.found[b.id] = Date.now(); save(); updateCount(); hint('★ ' + nm(b.id) + L(' keşfedildi', ' discovered')); } }
      else if (!G.card || !G.card.modal || isT) { G.near.add(b.id); discover(b.id); if (isT) setThr(0); } }
    else if (G.near.has(b.id) && d > lim*2.5) G.near.delete(b.id); });
  G.renderer.clear(); G.renderer.render(G.scene, G.camera);
  if (G.view === 'chase') { G.renderer.clearDepth(); G.renderer.render(G.shipScene, G.shipCam); }
  drawHud(bodies, tb); drawMap(bodies);
  // dock button: near a station, or while docked; parking next to one keeps you alongside it
  const ns = nearStation(), db = G.$('gkDock'), showDock = !!(G.dock || ns);
  if (db.hidden === showDock) db.hidden = !showDock; const dl = G.dock ? L('Ayrıl', 'Undock') : L('Kenetlen', 'Dock'); if (db.textContent !== dl) db.textContent = dl;
  const nsm = nearSmall(); if (nsm && !G.dock && !G.hold && G.speed < 3 && G.thr < 0.01 && !G.auto) G.hold = nsm;
}
function placeCamera(dt, sk) {
  const ship = G.ship, cam = G.camera, S = G.shut;
  if (!G.warp) cam.fov += ((70 + Math.min(14, G.speed/35)) - cam.fov)*Math.min(1, dt*2);
  cam.updateProjectionMatrix();
  if (G.view === 'chase') {
    // the camera swings after the shuttle: rotation lags, position stays locked behind it
    G.camQ.slerp(ship.quaternion, 1 - Math.exp(-dt*5));
    const tilt = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.16);
    const oq = G.camQ.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(G.orb.p, G.orb.y, 0, 'YXZ')));
    cam.quaternion.copy(oq).multiply(tilt);
    cam.position.copy(ship.position).add(new THREE.Vector3(0, 0.52, 1.85).applyQuaternion(oq));
    S.model.position.copy(ship.position); S.model.quaternion.copy(ship.quaternion);
    // bank into turns, nose follows pitch a little
    const yawIn = -G.steer.x + ((G.keys.arrowleft || G.keys.a) ? 1 : 0) - ((G.keys.arrowright || G.keys.d) ? 1 : 0);
    G.bank += (yawIn*0.55 - G.bank)*Math.min(1, dt*3); S.model.rotateZ(G.bank);
    const thrust = G.warp ? 5 : Math.min(3.2, 0.25 + G.thr*1.3 + (G.turbo ? 1.8 : 0) + G.speed/400);
    S.flames.forEach(f => { const fl = 0.85 + Math.random()*0.3; f.fl.scale.set(1, 1, Math.max(0.05, thrust*fl)); f.gl.scale.setScalar(0.5 + thrust*0.3*fl); f.fl.visible = G.speed > 0.5 || G.thr > 0; });
    G.shipSun.position.copy(ship.position).negate().normalize(); G.shipSun.target.position.set(0, 0, 0);
    G.shipSun.position.add(S.model.position); G.shipSun.target.position.copy(S.model.position); G.shipSun.target.updateMatrixWorld();
  } else { cam.position.copy(ship.position); cam.quaternion.copy(ship.quaternion); G.camQ.copy(ship.quaternion); }
  cam.position.add(new THREE.Vector3((Math.random() - 0.5)*sk*0.25, (Math.random() - 0.5)*sk*0.25, 0).applyQuaternion(cam.quaternion));
  cam.updateMatrixWorld();
  G.shipCam.position.copy(cam.position); G.shipCam.quaternion.copy(cam.quaternion); G.shipCam.fov = cam.fov; G.shipCam.updateProjectionMatrix();
}
/* docking: glide to the station's port, then ride along its orbit until undocked */
const DOCK = { ISS: [[0, -0.085, -0.57], Math.PI], Tiangong: [[0, 0, 0.77], 0], Hubble: [[0, 0, 0.67], 0] };
function nearSmall() { if (G.mode !== 'sol' || G.warp) return null; let best = null, bd = 9; G.sol.bodies.forEach(b => { if (!b.small) return; const d = worldPos(b).distanceTo(G.ship.position); if (d < bd) { bd = d; best = b; } }); return best; }
function nearStation() { if (G.mode !== 'sol' || G.warp) return null; let best = null, bd = 9; G.sol.bodies.forEach(b => { if (!b.small || !DOCK[b.id]) return; const d = worldPos(b).distanceTo(G.ship.position); if (d < bd) { bd = d; best = b; } }); return best; }
function dock() {
  if (G.dock) { undock(); return; } const b = nearStation(); if (!b) return;
  G.auto = false; G.$('gkAuto').classList.remove('on'); G.thr = 0; setThr(0); G.turbo = false; G.speed = 0; G.hold = null;
  G.dock = { b, t: 0, p0: G.ship.position.clone(), q0: G.ship.quaternion.clone(), done: false };
  hint(L('Kenetlenme başladı…', 'Docking…'));
}
function undock() {
  const b = G.dock.b, back = new THREE.Vector3(0, 0, 1).applyQuaternion(G.ship.quaternion); G.dock = null; G.hold = b; G.speed = 0;
  G.ship.position.addScaledVector(back, 2.2); bigMsg(L('Ayrıldın', 'Undocked'), '', 1200); hint(L('İstasyonun yanındasın. Gaz verince serbestçe uçarsın.', 'You are next to the station. Add thrust to fly free.'));
}
function updateDock(dt) {
  const D = G.dock; if (!D) return; const b = D.b, ship = G.ship;
  const port = b.obj.localToWorld(new THREE.Vector3(...DOCK[b.id][0])), pq = b.obj.getWorldQuaternion(new THREE.Quaternion()).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), DOCK[b.id][1]));
  G.speed = 0;
  if (!D.done) { D.t = Math.min(1, D.t + dt/3.2); const e = D.t*D.t*(3 - 2*D.t); ship.position.copy(D.p0).lerp(port, e); ship.quaternion.copy(D.q0).slerp(pq, e);
    if (D.t >= 1) { D.done = true; bigMsg(L('Kenetlendi!', 'Docked!'), nm(b.id), 1800); flash('radial-gradient(circle, rgba(126,240,194,.25), rgba(126,240,194,0) 70%)', 1);
      hint(L(nm(b.id) + '\'e bağlandın: Dünya\'nın etrafında birlikte dönüyorsunuz. Sürükleyerek manzaraya bak.', 'Docked to ' + nm(b.id) + ': you are circling Earth together. Drag to enjoy the view.')); } }
  else { ship.position.copy(port); ship.quaternion.copy(pq); }
}
function hit(dmg) {
  G.hitCD = 0.8; G.shield = Math.max(0, G.shield - dmg); G.shake = 1.2; G.speed *= 0.35; flash('radial-gradient(circle, rgba(255,80,60,0) 40%, rgba(255,60,40,.55))', 1);
  if (G.shield <= 0) { bigMsg(L('Kalkan tükendi!', 'Shield down!'), L('Mekik güvenli bölgeye çekildi', 'Shuttle pulled back to safety'), 2200); G.shield = 60; G.ship.position.y += 140; }
  else hint(L('Çarpışma! Kalkan %', 'Impact! Shield ') + Math.round(G.shield) + (LANG === 'en' ? '%' : ''));
}

/* maps. One drawer serves the corner map and the full map:
   'sys'   the system from above, square-root distances so Neptune and Mercury both fit
   'near'  the neighbourhood, linear, the shuttle's heading up
   'stars' the Sun and the star systems you can jump to, log distances in light-years */
const MAPCOL = { Sun: '#ffd27a', Mercury: '#b8aa98', Venus: '#f0d9a0', Earth: '#6fb3ff', Moon: '#cfcfcf', Mars: '#e07a4a', Ceres: '#9a948a', Jupiter: '#e6c89e', Saturn: '#efdca6', Uranus: '#9fe3ea', Neptune: '#5b84ea', ISS: '#ffffff', Tiangong: '#ffffff', Hubble: '#e8ecf2', JWST: '#ffc04a', Parker: '#f4f2ee', Voyager1: '#f2f0ea', Voyager2: '#f2f0ea', Phobos: '#8a7f74', Io: '#e8d26a', Europa: '#e9e2d6', Ganymede: '#b8ae9e', Callisto: '#8e8474', Titan: '#e0a050', Enceladus: '#f6f8fb', Triton: '#e3d2cc',
  AlphaCen: '#ffe7a8', Sirius: '#dfe9ff', Vega: '#cfe0ff', Betelgeuse: '#ff9a6a' };
function cometPos(t) { const a = 1500, e = 0.82, E = t*6.283; return new THREE.Vector3(a*(Math.cos(E) - e), Math.sin(E)*120, a*Math.sqrt(1 - e*e)*Math.sin(E)).applyAxisAngle(new THREE.Vector3(0, 1, 0), 2.1); }
function drawMapCore(g, W, H, V, bodies) {
  const big = V.big, pad = big ? 22 : 9, R = Math.min(W, H)/2 - pad, cx = W/2 + (V.panX || 0), cy = H/2 + (V.panY || 0), zoom = V.zoom || 1;
  const ship = G.ship.position, fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(G.ship.quaternion), picks = V.picks = [];
  const label = (t, x, y, col, size, align) => { g.fillStyle = col; g.font = '600 ' + size + 'px Manrope, sans-serif'; g.textAlign = align || 'left'; g.fillText(t, x, y); };
  const dot = (x, y, r, col, glow) => { if (glow) { const gr = g.createRadialGradient(x, y, 0, x, y, r*3); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r*3, 0, Math.PI*2); g.fill(); }
    g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, Math.PI*2); g.fill(); };
  const lsz = big ? 11.5 : 8;
  let P = null, scale = 1;
  if (V.mode === 'stars') {
    const lmax = Math.log10(1 + 700), f = ly => Math.log10(1 + ly)/lmax*R*zoom;
    [1, 5, 10, 25, 100, 500].forEach(ly => { g.strokeStyle = 'rgba(227,194,126,.13)'; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, f(ly), 0, Math.PI*2); g.stroke();
      if (big || ly >= 25) label(ly.toLocaleString(LANG === 'en' ? 'en' : 'tr') + L(' ı.y.', ' ly'), cx + 3, cy - f(ly) - 2, 'rgba(142,147,163,.8)', big ? 10 : 7); });
    dot(cx, cy, big ? 5 : 3, MAPCOL.Sun, true); label(L('Güneş', 'Sun'), cx + 7, cy + 4, '#ffe9b0', lsz); picks.push({ x: cx, y: cy, r: 16, id: 'Sun' });
    Object.keys(STARSYS).forEach(id => { const S = STARSYS[id], d = eq2game(eqv(S.ra, S.dec)), h = Math.hypot(d.x, d.z) || 1, x = cx + d.x/h*f(S.ly), y = cy + d.z/h*f(S.ly);
      g.strokeStyle = 'rgba(227,194,126,.18)'; g.setLineDash([3, 4]); g.beginPath(); g.moveTo(cx, cy); g.lineTo(x, y); g.stroke(); g.setLineDash([]);
      dot(x, y, big ? (id === 'Betelgeuse' ? 7 : 4.5) : (id === 'Betelgeuse' ? 4 : 2.6), MAPCOL[id], true);
      if (id === G.target) { g.strokeStyle = '#e3c27e'; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, big ? 12 : 7, 0, Math.PI*2); g.stroke(); g.lineWidth = 1; }
      label(nm(id) + (big ? ' · ' + S.ly.toLocaleString(LANG === 'en' ? 'en' : 'tr') + L(' ı.y.', ' ly') : ''), x + 8, y + 4, PROG.found[id] ? '#e3c27e' : 'rgba(233,228,216,.85)', lsz);
      picks.push({ x, y, r: 18, id }); });
    // where you are
    let hx = cx, hy = cy; if (G.mode !== 'sol') { const S = STARSYS[G.mode], d = eq2game(eqv(S.ra, S.dec)), h = Math.hypot(d.x, d.z) || 1; hx = cx + d.x/h*f(S.ly); hy = cy + d.z/h*f(S.ly); }
    g.strokeStyle = '#7ef0c2'; g.lineWidth = 1.5; g.beginPath(); g.arc(hx, hy, big ? 16 : 9, 0, Math.PI*2); g.stroke(); g.lineWidth = 1;
    if (big) label(L('Buradasın', 'You are here'), hx, hy + 30, '#7ef0c2', 10.5, 'center');
    return;
  }
  if (V.mode === 'near') {
    let near = null, nd = 1e9; bodies.forEach(b => { if (b.small) return; const d = worldPos(b).distanceTo(ship) - b.r; if (d < nd) { nd = d; near = b; } });
    const span = Math.max(12, Math.min(1400, near ? (nd + near.r)*1.6 : 300))/zoom; scale = R/span;
    const h = Math.atan2(fwd.x, -fwd.z), ch = Math.cos(h), sh = Math.sin(h);
    P = v => { const dx = v.x - ship.x, dz = v.z - ship.z, rx = dx*ch + dz*sh, rz = -dx*sh + dz*ch; return [W/2 + rx*scale, H/2 + rz*scale]; };
    g.strokeStyle = 'rgba(227,194,126,.12)'; [0.33, 0.66, 1].forEach(k => { g.beginPath(); g.arc(W/2, H/2, R*k, 0, Math.PI*2); g.stroke(); });
    if (big) label(Math.round(span/3*0.33*3) + L(' birim', ' units'), W/2 + R*0.33 + 3, H/2 - 3, 'rgba(142,147,163,.7)', 9.5);
  } else {
    const ext = G.mode === 'sol' ? 4600 : G.mode === 'Betelgeuse' ? 12000 : 4000, f = r => Math.sqrt(r/ext)*R*zoom;
    P = v => { const r = Math.hypot(v.x, v.z) || 1e-6, k = f(r)/r; return [cx + v.x*k, cy + v.z*k]; };
    if (G.mode === 'sol') {
      g.strokeStyle = 'rgba(160,150,135,.18)'; g.lineWidth = Math.max(1, f(1530) - f(1230)); g.beginPath(); g.arc(cx, cy, (f(1230) + f(1530))/2, 0, Math.PI*2); g.stroke(); g.lineWidth = 1;
      if (big && zoom < 3) label(L('Asteroit kuşağı', 'Asteroid belt'), cx, cy - (f(1230) + f(1530))/2 + 3, 'rgba(160,150,135,.75)', 9, 'center');
      PLANETS.forEach(p => { g.strokeStyle = p.id === 'Earth' ? 'rgba(111,179,255,.4)' : 'rgba(227,194,126,.18)'; g.beginPath(); g.arc(cx, cy, f(p.orbit), 0, Math.PI*2); g.stroke(); });
      // comet orbit and the comet itself
      g.strokeStyle = 'rgba(160,210,255,.22)'; g.setLineDash([2, 4]); g.beginPath(); for (let k = 0; k <= 120; k++) { const [x, y] = P(cometPos(k/120)); k ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); g.setLineDash([]);
      const [kx, ky] = P(cometPos(G.sol.comet.t)); dot(kx, ky, big ? 3 : 1.8, '#bfe3ff', true); if (big) label(L('Kuyruklu yıldız', 'Comet'), kx + 6, ky - 4, 'rgba(191,227,255,.8)', 9.5);
    } else if (G.sunDir) {
      // arrow toward home
      const a = Math.atan2(G.sunDir.z, G.sunDir.x), ex = cx + Math.cos(a)*R*0.92, ey = cy + Math.sin(a)*R*0.92;
      g.save(); g.translate(ex, ey); g.rotate(a); g.fillStyle = '#ffe9b0'; g.beginPath(); g.moveTo(7, 0); g.lineTo(-4, -5); g.lineTo(-4, 5); g.closePath(); g.fill(); g.restore();
      label(L('Güneş', 'Sun'), ex - Math.cos(a)*14, ey - Math.sin(a)*14 + 3, '#ffe9b0', lsz, 'center');
    }
  }
  // the shuttle's track
  if (G.trail && G.trail.length > 1) { g.strokeStyle = 'rgba(126,240,194,.45)'; g.lineWidth = big ? 1.6 : 1.1; g.beginPath(); G.trail.forEach((v, i) => { const [x, y] = P(v); i ? g.lineTo(x, y) : g.moveTo(x, y); }); const [sx0, sy0] = P(ship); g.lineTo(sx0, sy0); g.stroke(); g.lineWidth = 1; }
  // bodies
  const sysExtra = G.mode !== 'sol' && G.sys && G.sys.grp.userData.extra ? G.sys.grp.userData.extra.map(([o, n]) => ({ name: n, obj: o, r: 10 })) : [];
  const placedL = [];
  bodies.concat(sysExtra).forEach(b => {
    const isMinor = b.small || b.id === 'Moon' || b.parent;
    const v = b.obj.getWorldPosition(new THREE.Vector3()), [x, y] = P(v);
    // moons and craft hide while they would sit on top of their planet; zoom in to see them
    if (V.mode === 'sys' && isMinor) { const home = G.sol.bodies.find(q => q.id === (b.parent || 'Earth')), ep = P(worldPos(home)); if (Math.hypot(x - ep[0], y - ep[1]) < (big ? 14 : 99)) return; }
    const rr = V.mode === 'near' ? Math.max(b.small ? 2 : 3, b.r*scale) : b.star ? (big ? 7 : 4.5) : Math.max(big ? 2.6 : 2, Math.min(big ? 7 : 4, b.r/9 + 1.6))*(big ? Math.min(2, Math.sqrt(zoom)) : 1);
    if (x < -rr - 40 || x > W + rr + 40 || y < -rr - 40 || y > H + rr + 40) return;
    const col = MAPCOL[b.id] || (b.star ? '#fff1c2' : '#cfcfcf');
    if (b.id === 'Saturn' && V.mode !== 'near') { g.strokeStyle = 'rgba(239,220,166,.7)'; g.lineWidth = 1; g.beginPath(); g.ellipse(x, y, rr*2, rr*0.7, -0.4, 0, Math.PI*2); g.stroke(); }
    dot(x, y, rr, col, b.star);
    if (b.id && b.id === G.target) { g.strokeStyle = '#e3c27e'; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, rr + (big ? 6 : 4), 0, Math.PI*2); g.stroke(); g.lineWidth = 1; }
    if (b.id) picks.push({ x, y, r: Math.max(16, rr + 8), id: b.id });
    const show = big || (V.mode === 'near' && rr > 4) || b.id === G.target;
    if (show) { const t = b.id ? nm(b.id) + (PROG.found[b.id] ? ' ★' : '') : b.name, ly = y - rr - 4;
      if (!placedL.some(q => Math.abs(q[0] - x) < 40 && Math.abs(q[1] - ly) < 11)) { placedL.push([x, ly]); label(t, x, ly, b.id && PROG.found[b.id] ? '#e3c27e' : 'rgba(233,228,216,.85)', lsz, 'center'); } }
  });
  // line to the target
  const tb = G.target ? bodyById(G.target) : null;
  const [sx, sy] = P(ship);
  if (tb) { const [tx, ty] = P(worldPos(tb)); g.strokeStyle = 'rgba(227,194,126,.55)'; g.setLineDash([4, 4]); g.beginPath(); g.moveTo(sx, sy); g.lineTo(tx, ty); g.stroke(); g.setLineDash([]); }
  // the shuttle
  const ang = V.mode === 'near' ? 0 : Math.atan2(fwd.x, -fwd.z), k = big ? 1.5 : 1;
  g.save(); g.translate(sx, sy); g.rotate(ang); g.scale(k, k); g.fillStyle = '#e3c27e'; g.strokeStyle = '#14110a'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(0, -7); g.lineTo(5, 5); g.lineTo(0, 2.5); g.lineTo(-5, 5); g.closePath(); g.fill(); g.stroke(); g.restore();
}
function mapTitle(m) { return m === 'near' ? L('YAKIN ÇEVRE', 'NEARBY') : m === 'stars' ? L('YILDIZLAR', 'STARS') : G.mode === 'sol' ? L('GÜNEŞ SİSTEMİ', 'SOLAR SYSTEM') : nm(G.mode).toUpperCase(); }
function drawMap(bodies) {
  const c = G.$('gkMap'), sz = c.clientWidth; if (!sz) return; const px = Math.round(sz*G.pr); if (c.width !== px) { c.width = c.height = px; }
  const g = c.getContext('2d'); g.setTransform(G.pr, 0, 0, G.pr, 0, 0); g.clearRect(0, 0, sz, sz);
  g.save(); g.beginPath(); g.rect(1, 1, sz - 2, sz - 2); g.clip();
  drawMapCore(g, sz, sz, { mode: G.mapMode, zoom: 1, big: false }, bodies);
  g.restore();
  g.fillStyle = 'rgba(142,147,163,.95)'; g.font = '600 8.5px Manrope, sans-serif'; g.textAlign = 'left'; g.fillText(mapTitle(G.mapMode), 8, 13);
  g.fillStyle = 'rgba(227,194,126,.9)'; g.font = '700 12px Manrope, sans-serif'; g.textAlign = 'right'; g.fillText('⤢', sz - 7, 15);
  if (G.big) drawBigMap(bodies);
}
// full map: tabs, drag to pan, wheel or pinch to zoom, tap a body to pick it and fly there
function openBig() {
  const B = G.$('gkBig'); B.hidden = false; G.big = { mode: G.mapMode === 'near' ? 'near' : G.mode === 'sol' ? 'sys' : 'sys', zoom: 1, panX: 0, panY: 0, sel: null, big: true };
  syncBigTabs(); bigFooter();
}
function closeBig() { G.$('gkBig').hidden = true; G.big = null; }
function syncBigTabs() { G.$('gkBig').querySelectorAll('[data-m]').forEach(b => b.classList.toggle('on', b.dataset.m === G.big.mode)); }
function bigFooter() {
  const ft = G.$('gkBigFt'), sel = G.big.sel;
  if (!sel) { ft.innerHTML = '<span class="lg"><i style="background:#7ef0c2"></i>' + L('İzin', 'Your track') + '</span><span class="lg"><i style="background:#e3c27e"></i>' + L('Hedef', 'Target') + '</span><span class="tip">' + (G.mobile ? L('Bir cisme dokun · sürükle: kaydır · iki parmak: yakınlaştır', 'Tap a body · drag to pan · pinch to zoom') : L('Bir cisme tıkla · sürükle: kaydır · tekerlek: yakınlaştır', 'Click a body · drag to pan · wheel to zoom')) + '</span>'; return; }
  let dist = ''; const b = bodyById(sel);
  if (b) dist = fmtD(Math.max(0, worldPos(b).distanceTo(G.ship.position) - b.r)) + L(' birim', ' units');
  else if (STARSYS[sel]) dist = STARSYS[sel].ly.toLocaleString(LANG === 'en' ? 'en' : 'tr') + L(' ışık yılı · hiper sürüş', ' light-years · hyperdrive');
  else if (sel === 'Sun' || !b) dist = L('Güneş Sistemi', 'Solar System');
  ft.innerHTML = '<div class="sel"><b>' + nm(sel) + (PROG.found[sel] ? ' ★' : '') + '</b><small>' + tx2(INFO[sel].k) + ' · ' + dist + '</small></div><button class="b on" id="gkGo2">' + L('Buraya git', 'Fly here') + '</button><button class="b" id="gkSel0">' + L('Vazgeç', 'Cancel') + '</button>';
  G.$('gkGo2').onclick = () => { closeBig(); setTarget(sel); setAuto(true); };
  G.$('gkSel0').onclick = () => { G.big.sel = null; bigFooter(); };
}
function drawBigMap(bodies) {
  const c = G.$('gkBigC'), w = c.clientWidth, h = c.clientHeight; if (!w || !h) return;
  if (c.width !== Math.round(w*G.pr) || c.height !== Math.round(h*G.pr)) { c.width = Math.round(w*G.pr); c.height = Math.round(h*G.pr); }
  const g = c.getContext('2d'); g.setTransform(G.pr, 0, 0, G.pr, 0, 0); g.clearRect(0, 0, w, h);
  drawMapCore(g, w, h, G.big, bodies); G.big.picksNow = G.big.picks;
  if (G.big.sel) { const pk = (G.big.picks || []).find(p => p.id === G.big.sel); if (pk) { g.strokeStyle = '#7ef0c2'; g.lineWidth = 2; g.beginPath(); g.arc(pk.x, pk.y, pk.r, 0, Math.PI*2); g.stroke(); } }
}
function bindBig() {
  const B = G.$('gkBig'), c = G.$('gkBigC'), pts = new Map(); let pinch = null, moved = 0;
  G.$('gkMap').onclick = openBig; G.$('gkBigX').onclick = closeBig;
  B.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { G.big.mode = b.dataset.m; if (b.dataset.m !== 'stars') G.mapMode = b.dataset.m; G.big.zoom = 1; G.big.panX = G.big.panY = 0; syncBigTabs(); });
  c.addEventListener('pointerdown', e => { c.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); moved = 0;
    if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), z: G.big.zoom }; } });
  c.addEventListener('pointermove', e => { if (!pts.has(e.pointerId) || !G.big) return; const p0 = pts.get(e.pointerId), p1 = [e.clientX, e.clientY]; pts.set(e.pointerId, p1);
    if (pts.size === 2 && pinch) { const [a, b] = [...pts.values()]; G.big.zoom = Math.max(0.6, Math.min(40, pinch.z*Math.hypot(a[0] - b[0], a[1] - b[1])/pinch.d)); moved += 10; return; }
    if (G.big.mode !== 'near') { G.big.panX += p1[0] - p0[0]; G.big.panY += p1[1] - p0[1]; } moved += Math.abs(p1[0] - p0[0]) + Math.abs(p1[1] - p0[1]); });
  const up = e => { if (!pts.has(e.pointerId)) return; pts.delete(e.pointerId); if (pts.size < 2) pinch = null;
    if (e.type === 'pointerup' && moved < 8 && G.big) { const r = c.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      const hit = (G.big.picksNow || []).filter(p => Math.hypot(p.x - x, p.y - y) < p.r).sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0];
      G.big.sel = hit && INFO[hit.id] ? hit.id : null; bigFooter(); } };
  c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
  c.addEventListener('wheel', e => { e.preventDefault(); if (!G.big) return; const z0 = G.big.zoom, z1 = Math.max(0.6, Math.min(40, z0*Math.exp(-e.deltaY*0.0015)));
    // zoom about the cursor
    if (G.big.mode !== 'near') { const r = c.getBoundingClientRect(), mx = e.clientX - r.left - c.clientWidth/2, my = e.clientY - r.top - c.clientHeight/2;
      G.big.panX = mx - (mx - G.big.panX)*z1/z0; G.big.panY = my - (my - G.big.panY)*z1/z0; }
    G.big.zoom = z1; }, { passive: false });
}
const fmtD = d => d < 1000 ? Math.round(d).toString() : (d/1000).toFixed(1) + 'k';
function drawHud(bodies, tb) {
  const c = G.$('gkh'), g = c.getContext('2d'), W = innerWidth, H = innerHeight; g.setTransform(G.pr, 0, 0, G.pr, 0, 0); g.clearRect(0, 0, W, H);
  const cam = G.camera, v = new THREE.Vector3();
  const proj = p => { v.copy(p).project(cam); const behind = v.z > 1; return { x: (v.x*0.5 + 0.5)*W, y: (-v.y*0.5 + 0.5)*H, behind, on: !behind && Math.abs(v.x) < 1 && Math.abs(v.y) < 1 }; };
  // reticle
  if (G.view !== 'chase') { g.strokeStyle = 'rgba(227,194,126,.55)'; g.lineWidth = 1.2; g.beginPath(); g.arc(W/2, H/2, 14, 0, Math.PI*2); g.moveTo(W/2 - 26, H/2); g.lineTo(W/2 - 18, H/2); g.moveTo(W/2 + 18, H/2); g.lineTo(W/2 + 26, H/2); g.moveTo(W/2, H/2 + 18); g.lineTo(W/2, H/2 + 24); g.stroke(); }
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
  // lens flare
  const sunW = G.mode === 'sol' ? new THREE.Vector3() : G.sys.bodies[0].obj.position, fp = proj(sunW);
  if (fp.on) { const camP = cam.position, toS = sunW.clone().sub(camP), dS = toS.length(); toS.divideScalar(dS);
    const blocked = bodies.some(b => { if (b.star) return false; const c = worldPos(b).sub(camP), t = c.dot(toS); return t > 0 && t < dS && c.lengthSq() - t*t < b.r*b.r; });
    if (!blocked) { const cx = W/2, cy = H/2, dx = cx - fp.x, dy = cy - fp.y, k = Math.max(0, 1 - Math.hypot(dx, dy)/Math.hypot(W, H)*1.6);
      g.save(); g.globalCompositeOperation = 'lighter';
      const halo = g.createRadialGradient(fp.x, fp.y, 0, fp.x, fp.y, 160); halo.addColorStop(0, 'rgba(255,240,210,' + (0.35*k) + ')'); halo.addColorStop(1, 'rgba(255,220,170,0)'); g.fillStyle = halo; g.beginPath(); g.arc(fp.x, fp.y, 160, 0, Math.PI*2); g.fill();
      g.strokeStyle = 'rgba(255,235,200,' + (0.18*k) + ')'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(fp.x - 220*k, fp.y); g.lineTo(fp.x + 220*k, fp.y); g.stroke();
      [[0.35, 26, '150,190,255', 0.10], [0.6, 12, '255,200,140', 0.16], [0.9, 40, '170,255,210', 0.06], [1.25, 18, '255,160,200', 0.10], [1.6, 60, '140,170,255', 0.05]].forEach(([t, r, c, a]) => {
        const fx = fp.x + dx*t*2, fy = fp.y + dy*t*2, gr = g.createRadialGradient(fx, fy, 0, fx, fy, r); gr.addColorStop(0, 'rgba(' + c + ',' + (a*k) + ')'); gr.addColorStop(0.7, 'rgba(' + c + ',' + (a*k*0.6) + ')'); gr.addColorStop(1, 'rgba(' + c + ',0)');
        g.fillStyle = gr; g.beginPath(); g.arc(fx, fy, r, 0, Math.PI*2); g.fill(); });
      g.restore(); } }
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
  // opened from the sky with a destination: go straight there (after the launch intro the first time)
  const want = opts.target && INFO[opts.target] ? opts.target : null; G.pendingTarget = want;
  if (!PROG.seen) intro(); else if (want) { if (G.dock) undock(); setTarget(want); setAuto(true); bigMsg(L('Rota: ', 'Course: ') + nm(want), '', 1600); } else { setTarget(G.target || 'Mars'); }
}
function intro() {
  showCard('<div class="kk">' + L('Uzay mekiği', 'Space shuttle') + '</div><h3>' + L('Kalkışa hazır mısın?', 'Ready for launch?') + '</h3>' +
    '<ul><li>' + L('Dünya yörüngesindesin. Gezegenler şu anki gerçek konumlarında.', 'You are in Earth orbit. The planets are where they really are right now.') + '</li>' +
    '<li>' + L('Bir hedef seç, Otopilot seni götürsün; ya da direksiyona kendin geç.', 'Pick a target and let the autopilot fly, or take the controls yourself.') + '</li>' +
    '<li>' + L('Her varışta bir rozet kazanırsın; ayrıntı için çıkan etikete dokun. Asteroit ve meteorlara dikkat!', 'Every arrival earns a badge; tap the label that pops up for details. Watch out for asteroids and meteors!') + '</li></ul>' +
    '<div class="gkrow"><button class="b on" id="gkGo">' + L('Kalkış!', 'Launch!') + '</button></div>', true);
  G.$('gkGo').onclick = () => { PROG.seen = true; save(); hideCard(); let n = 3; const tick = () => { if (n > 0) { bigMsg(String(n), '', 800); n--; setTimeout(tick, 850); } else { bigMsg(L('Kalkış!', 'Liftoff!'), '', 1200); setThr(0.45); G.shake = 1; if (G.pendingTarget) { setTarget(G.pendingTarget); setAuto(true); } else setTarget('Moon'); } }; tick(); };
}
function close() {
  G.running = false; G.el.hidden = true; hideCard(); setAuto(false); G.turbo = false; G.keys = {};
  if (G.onClose) G.onClose();
}
window.GKGame = { open };
})();
