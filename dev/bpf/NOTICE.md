# مصدر سلسلة BPF Double Free

الملفات `main.js` و`common.js` و`rop.js` و`offsets.js` و`kernelExploit_bpf_double_free.js`
و`userland.js` و`webkitExploit_stackUnitializedRead.js` و`webkitExploit_haveABadTime.js`
والملفان `hen.bin` و`goldhen.bin` نسخة غير معدّلة من مشروع
**ArabPixel/WebKitty**، المرخّص تحت **AGPL-3.0**. النسخة الأصلية:
https://github.com/ArabPixel/WebKitty

الصفحتان `index.html` و`run.html` والملف `bridge.js` مكتوبين من الصفر لهذا الموقع،
وهم واجهة الهوست الأساسي لمصري / Masry. الـ bridge بيوفّر بس
الدوال الصغيرة اللي السلسلة بتتوقعها من هوست WebKitty (`log`، `getScript`،
`getPs4FwVersion`، `storage`) ومبيغيّر أي سطر في ملفات السلسلة نفسها.

الرخصة الكاملة في `LICENSE`. الشكر لـ ArabPixel وSiSTRo وكل أصحاب الأبحاث اللي
بنيت عليها السلسلة. هذه النسخة لم تُختبر على جهاز PS4 حقيقي من هنا.
