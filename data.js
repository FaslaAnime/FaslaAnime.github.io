/* نطاقات النسخ المدعومة في المحرك المدمج (jb/) مأخوذة من جدول دعم المشروع الأصلي */
const ERAS = [
  { id: "6", label: "6.xx" },
  { id: "78", label: "7 – 8" },
  { id: "9", label: "9.xx" },
  { id: "1011", label: "10 – 11" },
  { id: "1213", label: "12 – 13" }
];

const FIRMWARES = [
  { era: "6", range: "6.00 – 6.69", chain: "cssfontface", chainName: "CSSFontFace + Lapse", note: "أول نطاق يبدأ به المحرك المدمج", state: "يعمل" },
  { era: "6", range: "6.70 – 6.72", chain: "cssfontface", chainName: "BadHoist", note: "صفحة دخول محدودة ثم السلسلة الكاملة", state: "يعمل" },
  { era: "78", range: "7.00 – 8.52", chain: "cssfontface", chainName: "CSSFontFace + Lapse", note: "تغطية واسعة من متصفح السوني", state: "يعمل" },
  { era: "9", range: "9.00", chain: "psfree", chainName: "PSFree + Lapse + GoldHEN", note: "النسخة الذهبية، Golden Hen", state: "الأكثر استخداماً" },
  { era: "9", range: "9.60", chain: "psfree", chainName: "PSFree + Lapse", note: "نفس السلسلة مع أوفستات 9.60", state: "يعمل" },
  { era: "1011", range: "10.00 – 11.02", chain: "cssfontface", chainName: "CSSFontFace + Lapse", note: "مبني على أبحاث PPPwn", state: "يعمل" },
  { era: "1011", range: "11.03 – 12.02", chain: "slopkit", chainName: "Slopkit Lapse", note: "سلسلة أحدث للنسخ المتوسطة", state: "يعمل" },
  { era: "1213", range: "12.50 – 13.00", chain: "slopkit", chainName: "Slopkit Netctrl", note: "يعتمد على أبحاث TheFloW", state: "يعمل" },
  { era: "1213", range: "13.02 – 13.52", chain: "relapse", chainName: "Slopkit Relapse", note: "مُثبت على 13.02 / 13.04 / 13.50 / 13.52", state: "الأحدث" }
];

const ENGINE_FILES = [
  "core.js           41 KB   نواة الاستغلال",
  "jb.js            106 KB   السلاسل والبايلودات",
  "mem.js            27 KB   قراءة وكتابة الذاكرة",
  "ps4_offsets.js    18 KB   أوفستات النسخ",
  "device.js          9 KB   كشف النسخة",
  "goldhen.bin      293 KB   مُفعّل الهوم برو",
  "hen.bin          500 KB   HEN",
  "ps4debug.bin    3.1 MB   بايلود المطوّر"
];
