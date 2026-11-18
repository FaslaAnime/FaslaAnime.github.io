/* دليل إصدارات تهكير السوني 4 — المصري للعالميه
   الروابط كلها مأخوذة من مستودعات عامة لأصحابها. */
const RELEASES = [
  {
    fw: "1.76", year: "2014", category: "webkit", accent: "#7aa2ff",
    name: "أول تهكير للـ PS4", en: "PS4 1.76 WebKit + kexec",
    desc: "بداية القصة: استغلال WebKit سمح بتنفيذ كود داخل متصفح السوني، ومع kexec افتتح الطريق لتشغيل أنظمة ولينكس على الجهاز.",
    tags: ["WebKit", "kexec", "Linux"], credit: "fail0verflow",
    links: [{ label: "ps4-kexec", url: "https://github.com/fail0verflow/ps4-kexec" }]
  },
  {
    fw: "3.15", year: "2016", category: "webkit", accent: "#7aa2ff",
    name: "استغلال WebKit للنسخة 3.15", en: "PS4 3.15 WebKit Exploit",
    desc: "استغلال ويب كيت أتاح تنفيذ كود عشوائي (RCE) داخل متصفح النسخة 3.15، بدون سلسلة كيرنل كاملة.",
    tags: ["WebKit", "RCE"], credit: "qwertyoruiopz",
    links: [{ label: "Exploit Host", url: "https://github.com/Al-Azif/ps4-exploit-host" }]
  },
  {
    fw: "4.05", year: "2017", category: "kernel", accent: "#4ad991",
    name: "تهكير 4.05 الكامل", en: "PS4 4.05 Jailbreak",
    desc: "أول سلسلة كاملة تجمع WebKit مع استغلال الكيرنل، وسمحت بتشغيل Mira وبايلودات الهوم برو على النسخة 4.05.",
    tags: ["WebKit", "Kernel", "Mira"], credit: "flat_z / qwertyoruiopz",
    links: [{ label: "Exploit Host", url: "https://github.com/Al-Azif/ps4-exploit-host" }]
  },
  {
    fw: "4.55", year: "2017", category: "webkit", accent: "#7aa2ff",
    name: "استغلال WebKit للنسخة 4.55", en: "PS4 4.55 WebKit Exploit",
    desc: "استغلال ويب كيت للنسخة 4.55 سمح بتنفيذ كود داخل المتصفح، واتستخدم كنقطة دخول لتجارب كيرنل لاحقة.",
    tags: ["WebKit", "RCE"], credit: "community",
    links: [{ label: "Exploit Host", url: "https://github.com/Al-Azif/ps4-exploit-host" }]
  },
  {
    fw: "5.01", year: "2018", category: "webkit", accent: "#7aa2ff",
    name: "إثبات مفهوم WebKit", en: "PS4 5.01 WebKit Exploit PoC",
    desc: "PoC علني لاستغلال WebKit على النسخة 5.01 — خطوة مهمة وصلت لسلسلة 5.05 الكاملة بعدها بفترة قصيرة.",
    tags: ["WebKit", "PoC"], credit: "ALEXZZZ9",
    links: [{ label: "المستودع", url: "https://github.com/ALEXZZZ9/PS4-5.01-WebKit-Exploit-PoC" }]
  },
  {
    fw: "5.05", year: "2018", category: "kernel", accent: "#4ad991",
    name: "تهكير 5.05 — الأشهر", en: "PS4 5.05 Jailbreak",
    desc: "من أشهر النسخات على الإطلاق: سلسلة WebKit + كيرنل مستقرة، مع دعم واسع للبايلودات والهوم برو وGoldHEN.",
    tags: ["WebKit", "Kernel", "GoldHEN"], credit: "flat_z / CelesteBlue / Al-Azif",
    links: [
      { label: "Exploit Host", url: "https://github.com/Al-Azif/ps4-exploit-host" },
      { label: "هوست مباشر", url: "https://ps4boot.github.io/505/index.html" }
    ]
  },
  {
    fw: "5.50 / 5.56", year: "2018", category: "webkit", accent: "#7aa2ff",
    name: "استغلال WebKit فقط", en: "PS4 5.50 / 5.56 WebKit RCE",
    desc: "استغلال ويب كيت متاح لهذه النسخات، لكن بدون استغلال كيرنل علني — يعني تنفيذ كود داخل المتصفح فقط.",
    tags: ["WebKit", "RCE only"], credit: "community",
    links: [{ label: "Exploit Host", url: "https://github.com/Al-Azif/ps4-exploit-host" }]
  },
  {
    fw: "6.20", year: "2018", category: "webkit", accent: "#7aa2ff",
    name: "CVE-2018-4441", en: "PS4 6.20 WebKit RCE",
    desc: "استغلال WebKit موثق باستخدام الثغرة CVE-2018-4441 لحقن كود وتنفيذ أوامر على النسخة 6.20.",
    tags: ["WebKit", "CVE-2018-4441"], credit: "Cryptogenic",
    links: [{ label: "المستودع", url: "https://github.com/Cryptogenic/PS4-6.20-WebKit-Code-Execution-Exploit" }]
  },
  {
    fw: "6.72", year: "2019", category: "kernel", accent: "#4ad991",
    name: "تهكير 6.72 / BadHoist", en: "PS4 6.72 Jailbreak",
    desc: "سلسلة كاملة تعتمد على BadHoist مع استغلال الكيرنل، ومن أشهر هوستاتها Leeful وKameleon والهوست المباشر.",
    tags: ["WebKit", "BadHoist", "Kernel"], credit: "sleirsgoevy / Leeful",
    links: [
      { label: "ps4jb", url: "https://github.com/sleirsgoevy/ps4jb" },
      { label: "هوست مباشر", url: "https://ps4boot.github.io/672/index.html" }
    ]
  },
  {
    fw: "7.02", year: "2020", category: "kernel", accent: "#4ad991",
    name: "تهكير 7.02", en: "PS4 7.02 Jailbreak",
    desc: "سلسلة webkit + كيرنل للنسخة 7.02، اتطورت بعدها واتدمجت في هوستات 7.5x اللي بتدعم أكتر من نسخة.",
    tags: ["WebKit", "Kernel"], credit: "sleirsgoevy",
    links: [{ label: "هوست مطوّر", url: "https://github.com/hippie68/hippie68.github.io" }]
  },
  {
    fw: "7.50 – 7.55", year: "2020", category: "kernel", accent: "#4ad991",
    name: "تهكير 7.5x (الأفضل 7.55)", en: "PS4 7.50 – 7.55 Jailbreak",
    desc: "سلسلة مستقرة جداً للنسخات 7.50 لـ 7.55، مع دعم GoldHEN والبايلودات. النسخة 7.55 هي الأنسب لو قدرت تحدث لها.",
    tags: ["WebKit", "Kernel", "GoldHEN"], credit: "sleirsgoevy / ChendoChap",
    links: [{ label: "هوست مطوّر", url: "https://github.com/hippie68/hippie68.github.io" }]
  },
  {
    fw: "8.00 – 8.52", year: "2021", category: "modern", accent: "#ff6b9d",
    name: "CSSFontFace + Lapse", en: "PS4 8.00 – 8.52 Chain",
    desc: "سلاسل حديثة تعتمد على CSSFontFace مع استغلال Lapse لتغطية النسخات من 8.00 وحتى 8.52 من داخل المتصفح.",
    tags: ["CSSFontFace", "Lapse", "HEN"], credit: "nathanfargo / SpecterDev / ChendoChap",
    links: [{ label: "هوست متعدد النسخ", url: "https://github.com/X-F1REBALL-X/ps4jb" }]
  },
  {
    fw: "9.00", year: "2021", category: "kernel", accent: "#f5c451", featured: true,
    name: "Golden Hen / pOOBs4 + GoldHEN", en: "PS4 9.00 — PSFree + Lapse",
    desc: "النسخة الذهبية: استغلال PSFree webkit مع Lapse kernel وGoldHEN. تهكير Golden Hen (pOOBs4) بيشتغل من المتصفح بدون USB في أغلب الهوستات.",
    tags: ["WebKit", "PSFree", "Lapse", "GoldHEN", "بدون USB"], credit: "ChendoChap / abc / SiSTRo",
    links: [
      { label: "Golden Hen (pOOBs4)", url: "https://github.com/ChendoChap/pOOBs4" },
      { label: "PSFree", url: "https://github.com/kmeps4/PSFree" },
      { label: "GoldHEN", url: "https://github.com/GoldHEN/GoldHEN" },
      { label: "هوست", url: "https://github.com/kmeps4/leeful900" }
    ]
  },
  {
    fw: "9.60", year: "2022", category: "modern", accent: "#ff6b9d",
    name: "استغلال 9.60", en: "PS4 9.60 WebKit + Lapse",
    desc: "سلسلة webkit للنسخة 9.60 مع دعم Lapse، متاحة كمان عبر هوستات مدمجة تغطي 7.00 لـ 9.60.",
    tags: ["WebKit", "Lapse", "GoldHEN"], credit: "abc / ChendoChap",
    links: [
      { label: "هوست مباشر", url: "https://ps4boot.github.io/960/index.html" },
      { label: "LibrePS", url: "https://github.com/dklszdev/libreps-exploit" }
    ]
  },
  {
    fw: "10.00 – 11.02", year: "2024", category: "network", accent: "#ff6b9d",
    name: "PPPwn + CSSFontFace", en: "PS4 10.00 – 11.02",
    desc: "PPPwn من TheFloW استغل PPPoE عبر كابل الشبكة، واتدمج مع CSSFontFace/Lapse عشان يشتغل من المتصفح على هذه النسخات.",
    tags: ["PPPwn", "CSSFontFace", "Lapse"], credit: "TheFloW / nathanfargo",
    links: [
      { label: "PPPwn", url: "https://github.com/TheOfficialFloW/PPPwn" },
      { label: "هوست متعدد النسخ", url: "https://github.com/X-F1REBALL-X/ps4jb" }
    ]
  },
  {
    fw: "11.00", year: "2024", category: "network", accent: "#ff6b9d",
    name: "PPPoE Jailbreak", en: "PS4 11.00 PPPwn",
    desc: "أول تهكير علني للنسخة 11.00 عبر PPPwn مع اتصال Ethernet مباشر بين الكمبيوتر والسوني، ومعاه تجارب OKAge.",
    tags: ["PPPwn", "Ethernet", "OKAge"], credit: "TheFloW / obhq",
    links: [
      { label: "PPPwn", url: "https://github.com/TheOfficialFloW/PPPwn" },
      { label: "jailbreak-11", url: "https://github.com/obhq/jailbreak-11" }
    ]
  },
  {
    fw: "11.03 – 12.02", year: "2025", category: "modern", accent: "#ff6b9d",
    name: "Slopkit Lapse", en: "PS4 11.03 – 12.02",
    desc: "سلسلة Slopkit مع Lapse تغطي النسخات من 11.03 لـ 12.02، ومعها هوستات بتقدّم GoldHEN وHEN جوه المتصفح.",
    tags: ["Slopkit", "Lapse", "GoldHEN"], credit: "jordyidk / raw13g",
    links: [
      { label: "هوست متعدد النسخ", url: "https://github.com/X-F1REBALL-X/ps4jb" },
      { label: "PS4Boot", url: "https://github.com/ps4boot/ps4boot.github.io" }
    ]
  },
  {
    fw: "12.50 – 13.00", year: "2025", category: "modern", accent: "#ff6b9d",
    name: "Slopkit Netctrl", en: "PS4 12.50 – 13.00",
    desc: "سلسلة Netctrl المعتمدة على أبحاث TheFloW تغطي النسخات 12.50 لـ 13.00، ومتاحة في هوستات ويب حديثة.",
    tags: ["Netctrl", "Slopkit", "HEN"], credit: "TheFloW / jordyidk",
    links: [{ label: "هوست متعدد النسخ", url: "https://github.com/X-F1REBALL-X/ps4jb" }]
  },
  {
    fw: "13.02 – 13.52", year: "2026", category: "modern", accent: "#4ad991",
    name: "Slopkit Relapse — الأحدث", en: "PS4 13.02 – 13.52",
    desc: "أحدث سلسلة متاحة: Slopkit Relapse مع أوفستات وباتشات للنسخات 13.02 و13.04 و13.50 و13.52. مُثبتة على هذه النسخات.",
    tags: ["Relapse", "Slopkit", "GoldHEN"], credit: "raw13g / jordyidk / B4411M",
    links: [
      { label: "هوست متعدد النسخ", url: "https://github.com/X-F1REBALL-X/ps4jb" },
      { label: "صفحة الهوست", url: "https://x-f1reball-x.github.io/ps4jb/" }
    ]
  }
];

const CATEGORY_LABELS = {
  webkit: "ويب كيت",
  kernel: "كيرنل + HEN",
  network: "PPPwn / شبكة",
  modern: "سلسلة حديثة"
};
