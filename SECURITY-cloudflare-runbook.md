# Броня сайта bike50cc-nha-trang.asia — runbook

Хостинг: **GitHub Pages**. Регистратор: **PA Vietnam** (access.pavietnam.vn). CDN/защита: **Cloudflare (Free)**.

---

## СТАТУС на 12.09.2026

**Сделано:**
- ✅ Токен GitHub убран из локального `.git/config` (remote переведён на чистый https). ⚠️ Сам токен на GitHub **отозвать вручную** (Settings → Developer settings → PAT → Revoke), если ещё не сделано.
- ✅ Домен добавлен в Cloudflare, NS у PA Vietnam переключены на `corey.ns.cloudflare.com` + `gabriella.ns.cloudflare.com`, статус **Active**.
- ✅ DNS: 4×A (185.199.108–111.153) + CNAME www → olegbabaskinam-dotcom.github.io, все Proxied; 2×TXT (google/yandex verification) DNS-only.
- ✅ SSL/TLS: **Full (strict)**.
- ✅ Edge Certificates: Always Use HTTPS ON, Automatic HTTPS Rewrites ON, TLS 1.3 ON.
- ✅ Заголовки безопасности (Rules → Response Header Transform Rule «Security Headers», All incoming requests):
  - X-Content-Type-Options: nosniff
  - Referrer-Policy: strict-origin-when-cross-origin
  - X-Frame-Options: DENY
  - Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=(), usb=(), interest-cohort=()
- ✅ CSP — пока в режиме **Report-Only** (5-й заголовок в том же правиле), см. п.1 «Осталось».
- ✅ Security → Bots: Bot Fight Mode ON. AI-краулеры: «mixed purpose crawlers allowed» (чтобы не задеть SEO/индексацию). AI Labyrinth OFF.
- ✅ Rate-limit (Security → Security rules → Rate limiting rules): URI Path wildcard `/*`, по IP, **Block**, 300 req / 1 min, duration 10 sec. (На Free доступен только Block; Managed Challenge — платный Pro.)

**Осталось (через 2–3 дня, когда всё отстоится):**

### 1. CSP → в боевой режим
CSP сейчас `Content-Security-Policy-Report-Only` — только наблюдает, ничего не блокирует. Текущее значение (подобрано под реальные ресурсы сайта — только Google Fonts; GA/GTM на сайте нет, iframe и форм нет):
```
default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests
```
Как включить:
1. Открыть сайт на всех языках (RU/EN/KR), F12 → Console. Искать сообщения вида «… would have been blocked by CSP».
2. Если чисто — открыть правило «Security Headers», у 5-го заголовка убрать `-Report-Only` из имени (оставить `Content-Security-Policy`) → Deploy.
3. Если что-то легитимное блокируется — дописать его домен в нужную директиву, потом переключать.
Если позже подключишь Google Analytics — расширить script-src/img-src/connect-src доменами googletagmanager.com + google-analytics.com.

### 2. HSTS
SSL/TLS → Edge Certificates → **Enable HSTS**:
- Max-Age: **6 months**
- Include subdomains: **ON**
- Preload: **OFF** (включать только когда всё стабильно — откат почти невозможен)
Включать в последнюю очередь: HSTS браузеры кешируют на полгода и потом отказываются от http — если у https всплывёт косяк, посетители получат недоступный сайт.

---

## Проверка после включения
- securityheaders.com → должно стать A/A+.
- ssllabs.com/ssltest → сертификат/цепочка.
- Google Analytics Realtime — если/когда подключён.
