# النشر على GitHub Pages + Cloudflare Worker

الفكرة: **الموقع ثابت على GitHub Pages** (زي ما هو)، و**الـ API والأدمن على Cloudflare Worker**
المجاني. الـ Worker بيحتاج شيئين من Cloudflare: مخزن KV وكلمة مرور الأدمن.

## أسهل طريقة — سكربت أوتوماتيك

`deploy.ps1` بيعمل كل الخطوات اللي تحت (KV + كلمة المرور + نشر + تحديث الروابط):

```powershell
cd worker
$env:CLOUDFLARE_API_TOKEN="TOKEN"          # من dashboard.cloudflare.com > My Profile > API Tokens
$env:CLOUDFLARE_ACCOUNT_ID="ACCOUNT_ID"    # من صفحة Workers > Account ID
$env:ADMIN_PASSWORD="كلمة-قوية"
.\deploy.ps1
```

بعدين اعمل commit و push لثلاث ملفات: `dev/index.html`, `admin/index.html`, `wrangler.toml`.
كل الحاجات على الخطة المجانية (Workers Free + KV Free + GitHub Pages).

النشر تم فعلاً على:
- **Worker:** `https://masry-license.mohamedsaadq389.workers.dev`
- **Account ID:** `77a471286129f5eb1b72717f68a85e5a`
- **KV ID:** `b843599c07454858a456f7e95ae81d27`

> ملاحظة: من الجهاز اللي اتنشر منه، الاتصال بـ `workers.dev` فشل بسبب
> `ERR_SSL_VERSION_OR_CIPHER_MISMATCH` (مشكلة TLS محلية/شبكة). النشر نفسه ناجح
> وموثّق في Cloudflare API. اختبر الرابط من متصفحك أو من PS4.

## خطوات يدوية (لو السكربت مش مناسب)

## 1) حساب Cloudflare

سجّل دخول في `https://dash.cloudflare.com`. الـ Worker والـ KV مجانيين ضمن الخطة المجانية
(حتى 100 ألف طلب يوم).

## 2) تجهيز الـ KV

من داخل مجلد `worker`:

```bash
cd worker
npx wrangler login
npx wrangler kv:namespace create MASRY_KV
```

الأخير بيطبع حاجة زي:

```
[[kv_namespaces]]
binding = "MASRY_KV"
id = "اكتب_الرقم_هنا"
```

انسخ الـ `id` والصقه في `wrangler.toml` مكان `PUT_KV_NAMESPACE_ID_HERE`.

## 3) كلمة مرور الأدمن

```bash
npx wrangler secret put ADMIN_PASSWORD
```

اكتبها عند المطالبة. لو مش هتضبطها، تسجيل الدخول هيرجع `not_configured` ويرفض.

## 4) النشر

```bash
npx wrangler deploy
```

أول مرة بياخد وقتاً بسيطاً، وبعدها يعطيك العنوان:

```
https://masry-license.<YOUR_SUBDOMAIN>.workers.dev
```

## 5) ربط الموقع بالـ Worker

رابط الـ Worker لازم يتحط في مكانين (أو يتحفظ مرة بـ `?api=`):

- `dev/index.html` ← `<meta name="masry-api" content="../">` غيّر `../` لرابط الـ Worker كاملًا.
- `admin/index.html` ← `<meta name="masry-api" content="">` وحط نفس الرابط.

طريقة أسرع: افتح الصفحة مرة واحدة بــ `?api=https://masry-license.../`
من أي متصفح، وهو بيتكتب في `localStorage` لكل الصفحات على نفس النطاق.

> لو سيبت `content="../"` (النسخة الحالية)، الهوست على Pages مش هيلقى API ويعتبر
> نفسه «غير متصل» ويسمح بالتفعيل — يعني الترخيص بيكون مفعول بس على السيرفر المحلي.
> عشان القفل يشتغل على الزبائن، لازم الرابط يتحط في النسخة المنشورة.

## 6) الاستخدام

- الهوست: `https://faslaanime.github.io/dev/index.html` — يسجّل الجهاز ويعرض الحالة والعلامة.
- الأدمن: `https://faslaanime.github.io/admin/` — يدخل بكلمة المرور، يعرض الأجهزة، ويعمل تفعيل/إبطال.
- الـ API مباشرة: `https://masry-license.../api/v1/config`.

## 7) توصيل البايلود عبر الـ Worker (اختياري)

`/api/v1/license` بيرجع `blobToken` صالح 10 دقائق. البايلود يُتوصل من:

```
https://masry-license.../api/v1/blob/dev/jb/relapse/goldhen.bin?token=<blobToken>
```

الـ Worker يجيب الملف من `PAGES_ORIGIN` ويتأكد إن الترخيص سارٍ. ده يمنع سحب البايلود
من Pages مباشرة بدون ترخيص.

## 8) ملاحظات أمان

- CORS مفتوح (`*`) على الـ API لأنها غير سرية؛ الأدمن محمي بجلسة Bearer.
- حد معدل محاولات الدخول لكل isolate (ذاكرة العامل)، 5 محاولات/دقيقة.
- لو عندك دومين خاص، اربط الـ Worker بيه عبر Custom Domain بدل `workers.dev`،
  علشان الرابط يثبت في الكود.
- احذف المخزن/الكلمة لو باعت المشروع أو غيّرت الملكية.

## 9) التطوير محلياً

```bash
cd worker
npx wrangler dev
```

يشتغل على `http://localhost:8787` وبرضه محتاج الـ KV binding (wrangler dev بيتعامل معاه تلقائياً).
