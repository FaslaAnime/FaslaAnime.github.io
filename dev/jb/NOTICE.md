# مصدر سلاسل PS4JB داخل الهوست الأساسي

الملفات جوه `relapse/` و`cssfontface/` و`slopkit/` و`psfree/` نسخ غير معدّلة
من ملفات المحرك والسلاسل المخزّنة في مجلد `jb/` في جذر الموقع، والمصدر الأصلي:

- **X-F1REBALL-X / PS4JB**: محرك `jb.js` وتوصيل 13.02–13.52، مرخّص AGPL-3.0.
- **ArabPixel/WebKitty**: سلاسل CSSFontFace وSlopkit وPSFree والـ kpatches
  والبايلودات، مرخّصة AGPL-3.0. https://github.com/ArabPixel/WebKitty

ملفات `badhoist/672entrypoint.js` و`badhoist/672kexploit.js` نسخ غير معدّلة
من `src/badhoist/` في WebKitty (AGPL-3.0)، للمستخدم 6.70–6.72:

- **Fire30**: Bad Hoist userland exploit.
- **sleirsgoevy**: 6.7x kernel exploit.
- **Feyzee61**: implementation port used by WebKitty.

الملفات دي اتنقلت كما هي عشان كل حاجة تبقى جوه `dev/` زي `ag/` و`bpf/`،
من غير ما يتغيّر أي سطر في كود الاستغلال أو البايلودات.

اللي اكتب من الصفر هنا: `index.html` لكل سلسلة، و`bridge.js`، والربط بين
الواجهة والملفات. دي واجهة هوست مصري / Masry فقط.

الرخصة الكاملة والإسناد الأصلي محفوظين في `jb/LICENSE` و`jb/NOTICE`
و`jb/README.md` و`jb/MODIFICATIONS.md` في جذر الموقع.

جدول `slopkit/ps4_offsets.js` هو نسخة WebKitty الحالية؛ النسخة القديمة كانت مفيش
فيها aliases للنسخ الحقيقية `9.51` و`9.60` و`10.01` و`10.70` و`10.71` و`11.02`،
فالملف اتحدّث واتضافت الـ kpatches المطلوبة (`950.bin` و`1000.bin` و`1050.bin`
و`1102.bin`) من `src/kpatches/` في WebKitty، كلها مطابقة للمصدر بالـ SHA256.

الأرقام `11.03` و`12.03 – 12.49` مش أرقام نسخ PS4 حقيقية: سوني قفزت من `11.02`
لـ `11.50` ومن `12.02` لـ `12.50`، فمفيش جهاز محتاج سلسلة لهم، واتشالوا من
قائمة الاختيارات بدل ما يظهروا كخيار بيفشل. النسخ الأقدم من `4.50` مفيش لها
سلسلة WebKit وكيل كاملة في أي مصدر عام.

هذه النسخة لم تُختبر على جهاز PS4 حقيقي من هنا.
