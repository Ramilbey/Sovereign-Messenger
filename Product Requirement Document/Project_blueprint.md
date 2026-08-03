# PROJECT_BLUEPRINT.md — Sovereign Messenger

**Maqsad:** Bu hujjat loyihaning o'zgarmas asosi (single source of truth). Har qanday agent yoki dasturchi kod yozishdan OLDIN shu faylni to'liq o'qishi shart. Bu yerda yozilgan qoidalarga zid hech qanday dizayn qarori mustaqil qabul qilinmaydi — agar vaziyat bu yerda yozilmagan bo'lsa, agent taxmin qilish o'rniga savol berishi kerak.

**Munosabat:** Agar kod va shu hujjat bir-biriga zid bo'lsa, hujjat ustun turadi, kod yangilanadi.

---

## 1. Project Vision

Sovereign Messenger — bu **Telegram klon emas**. Bu O'zbekiston Respublikasi davlat idoralari uchun rasmiy, xavfsiz, ichki muloqot platformasi. Matrix protokoli (Synapse) + Element Web asosida qurilgan, lekin Telegram darajasidagi qulaylik bilan.

**Hissiy maqsad:** foydalanuvchi ilovani ochganda darhol "bu rasmiy davlat tizimi" deb his qilishi kerak, lekin ishlatish qiyin bo'lmasligi kerak — chunki interfeys Telegram'ga o'xshash, tanish.

**Nima EMAS:**
- Bu consumer messenger emas (ochiq ro'yxatdan o'tish yo'q, federatsiya yo'q, public discovery yo'q)
- Bu "yana bitta chat app" emas — bu tashkiliy ierarxiyani aks ettiruvchi rasmiy tizim

---

## 2. Architecture (o'zgarmas)

| Komponent | Vazifasi |
|---|---|
| Matrix Synapse | Backend — xabarlar, foydalanuvchilar, xonalar |
| PostgreSQL 15 | Ma'lumotlar bazasi |
| Element Web (fork) | Frontend — foydalanuvchi ko'radigan interfeys |
| Nginx | Reverse proxy, TLS |
| Docker | Konteynerlash |

**Qat'iy qoida:** Matrix protokol qatlamiga (matrix-js-sdk, sync, event timeline, crypto) hech qanday UI o'zgarishi ta'sir qilmasligi kerak. Faqat taqdimot qatlami (CSS, komponentlar, config) o'zgaradi.

**Development vs Production rejimi:** ikkalasi ham mavjud bo'lishi kerak (`dev.sh` / `prod.sh`). Sprint 1 mavjud `dev.sh` (webpack-dev-server) orqali ishlaydi — alohida Docker'siz muhit endi kerak emas (§9'ga qarang, 2026-08-01'da yangilangan qaror).

---

## 3. Government Structure (Tashkiliy Model)

Ierarxiya har doim shu tartibda:

```
Respublika (National)
 └─ Viloyat / Region (masalan: Samarqand)
     └─ Tashkilot / Department (masalan: Ichki Ishlar)
         └─ Bo'lim / Sub-department (masalan: Tergov)
             └─ Workspace
```

**Pilot uchun (Sprint 1):** faqat bitta shoxcha to'liq ishlab chiqiladi — **Samarqand → Ichki Ishlar → Tergov**. Boshqa viloyat/tashkilot/bo'limlar hozircha faqat sidebar'da ko'rinishi mumkin (bo'sh yoki "tez orada"), to'liq funksional bo'lishi shart emas. Quyidagi to'liq ro'yxat — **uzoq muddatli reference model**, Sprint 1 doirasi emas.

### 3.1 To'liq tashkilotlar ro'yxati (Samarqand viloyati misolida, boshqa viloyatlar xuddi shu shablon bo'yicha)

```
Samarqand viloyati
├── Hokimlik            (Hokim, Hokim o'rinbosarlari, Kotibiyat, Kadrlar, Moliya, IT, Axborot xizmati, Yuridik)
├── Ichki Ishlar         (Rahbariyat, Tergov, Jinoyat Qidiruv, Jamoat Xavfsizligi, YHX, Kadrlar, Moliya, IT)
├── DXX                  (Rahbariyat, Operativ boshqarma, Analitika, Kiberxavfsizlik, Ichki xavfsizlik, Maxsus aloqa, Kadrlar, Moliya, IT)
├── FVV                  (Rahbariyat, Operativ navbatchilik, Yong'in xavfsizligi, Qutqaruv xizmati, Logistika, Aloqa markazi, Kadrlar, Moliya, IT)
├── Sog'liqni Saqlash    (Rahbariyat, Kasalxonalar koordinatsiyasi, Poliklinikalar, Tez yordam, Epidemiologiya, Dorilar ta'minoti, Kadrlar, Moliya, IT)
├── Adliya               (Rahbariyat, Yuridik xizmat, Davlat xizmatlari, Notariat, FHDYO, Huquqiy targ'ibot, Kadrlar, Moliya, IT)
├── Soliq                (Rahbariyat, Soliq nazorati, Yuridik shaxslar, Jismoniy shaxslar, Audit, Tahlil va statistika, Kadrlar, Moliya, IT)
├── Raqamli Texnologiyalar (Rahbariyat, Dasturiy ta'minot, Tarmoq administratorlari, Server va Data Center, Axborot xavfsizligi, Help Desk, DevOps, Kadrlar, Moliya, Loyihalar boshqaruvi)
├── Maktabgacha va Maktab Ta'limi (Rahbariyat, Maktablar koordinatsiyasi, Maktabgacha ta'lim, O'qituvchilar bilan ishlash, O'quv dasturlari, Monitoring, Kadrlar, Moliya, IT)
├── Milliy Gvardiya      (Rahbariyat, Jamoat tartibi, Muhim obyektlarni qo'riqlash, Tezkor bo'linmalar, Operativ navbatchilik, Kadrlar, Moliya, IT)
└── Prokuratura          (Rahbariyat, Jinoyat ishlari nazorati, Fuqarolik ishlari, Tergov ustidan nazorat, Sudlarda ishtirok etish, Murojaatlar bilan ishlash, Kadrlar, Moliya, IT)
```

**Qat'iy qoida:** Bu daraxt kelajakda `demo-organization.json` yoki haqiqiy backend provisioning uchun **reference data** bo'lib xizmat qiladi. Sprint 1'da faqat `Ichki Ishlar → Tergov` shoxchasi to'liq ishlaydi.

### 3.2 Workspace Standarti — Universal + Maxsus

**Qoida: har bir Workspace 80% Universal, 20% bo'limga xos (Maxsus) modullardan iborat.**

#### Universal modullar (HAR BIR bo'limda bir xil)

| Modul | Vazifasi |
|---|---|
| 📢 Kanallar (Channels) | Faqat muhim e'lonlar. Yozadi: Rahbar + Administrator. O'qiydi: hamma. |
| 💬 Guruhlar (Groups) | Xodimlar ishlaydigan joy (Umumiy, Operativ, Navbatchilik, Loyihalar, Vaqtinchalik). Vaqtinchalik guruhlar operatsiya tugagach arxivga o'tishi mumkin — **bu avtomatlashtirish Sprint 1'da emas, kelajakda** (§11 Kelajak Rejalari'ga qarang). |
| 👥 Xodimlar (Members) | Rahbar + xodimlar ro'yxati, status bilan: 🟢 Ishda / 🟡 Yig'ilishda / 🔴 Band / ⚫ Offline. Profilga bosish mumkin. |
| 📁 Hujjatlar (Documents) | Buyruqlar, Hisobotlar, Shablonlar, PDF/Excel/Word, Arxiv. Version history — **kelajakda**, Sprint 1'da shart emas. |
| ✅ Vazifalar (Tasks) | Rahbar yaratadi, xodim bajaradi. Oddiy checklist ko'rinishi. |
| 📅 Kalendar | Kunlik jadval (vaqt + tadbir nomi). |
| 📊 Dashboard | Faqat Rahbar uchun: online/offline xodimlar soni, vazifalar statistikasi, favqulodda holatlar soni. Oddiy xodim faqat o'z vazifalarini ko'radi. |
| 📌 Pinned | Muhim xabarlar/kanallarni tepaga qadash. |
| ⚙ Workspace sozlamalari | Faqat Rahbar uchun: Permissions → Members → Groups → Channels → Archive → Audit Logs. Audit Logs — **kelajakda** (PRD'dagi audit savoli bilan bog'liq, hozircha ochiq). |

#### Bo'limga xos (Maxsus) modullar — misollar

| Tashkilot/Bo'lim | Universal + qo'shimcha modullar |
|---|---|
| Ichki Ishlar → Tergov | 🗂 Ishlar (Cases), 👤 Gumonlanuvchilar, 📷 Dalillar, 📜 Bayonnomalar, ⚖ Sud materiallari |
| FVV → Qutqaruv | 🚨 Hodisalar, 📍 Xarita, 🚒 Texnikalar, 📡 Chaqiruvlar, 🌦 Ob-havo |
| Sog'liqni Saqlash | 🏥 Shifoxonalar, 🚑 Tez yordam, 💊 Dorilar, 📈 Statistikalar, 👨‍⚕ Navbatchilik |
| Hokimlik | 📜 Farmoyishlar, 📑 Qarorlar, 🏗 Loyihalar, 💰 Budjet, 📍 Tumanlar |
| Prokuratura | ⚖ Ish yuritish, 📂 Nazorat ishlari, 📜 Xulosalar, 📨 Murojaatlar, 🏛 Sud ishlari |
| IT (Raqamli Texnologiyalar) | 🖥 Serverlar, 🌐 Tarmoq, 🔐 Xavfsizlik, 📊 Monitoring, 🎫 Help Desk |

**Sprint 1 uchun amaliy xulosa:** Tergov Workspace = 9 ta Universal modul + 5 ta Maxsus modul (Ishlar, Gumonlanuvchilar, Dalillar, Bayonnomalar, Sud materiallari). Boshqa qatordagi tashkilotlar (Qutqaruv, Sog'liqni Saqlash va h.k.) — faqat reference, Sprint 1'da qurilmaydi.

### Kanallar — ruxsat qoidasi (barcha Workspace'larda bir xil)

```
📢 E'lonlar / Buyruqlar / Favqulodda xabarlar / Haftalik reja / Yangiliklar
Kim yozadi? ✅ Rahbar, ✅ Administrator
Kim o'qiydi? ✅ Hamma
```

---

## 4. Permission Model

| Rol | Ko'radi | Qila oladi |
|---|---|---|
| **Employee** | Faqat o'z bo'limi workspace'i | Xabar yozish, kanalda o'qish/yozish (agar ruxsat bo'lsa) |
| **Manager (Department Manager)** | O'z bo'limi + boshqaruv | Kanal yaratish, a'zolarni boshqarish, e'lon joylash |
| **Regional Admin** | O'z viloyatidagi barcha tashkilotlar | Tashkilot darajasida boshqaruv |
| **National Admin** | Barcha viloyatlar | To'liq boshqaruv, milliy e'lonlar |
| **IT Admin** | Texnik boshqaruv | Foydalanuvchi yaratish, tizim sozlamalari (chat kontentini ko'rmaydi) |

**Qat'iy qoida:** UI rol asosida butunlay farq qilishi kerak — Employee login qilganda Manager tugmalarini "disabled" holatda ko'rsatish emas, balki UMUMAN ko'rsatmaslik kerak. Bu Sprint 1'ning eng muhim texnik talabi (Permission Context orqali amalga oshiriladi).

---

## 5. Policies

- **Workspace Policy:** har bir workspace birinchi marta ochilganda, agar foydalanuvchi hali qabul qilmagan bo'lsa, policy modal ko'rsatiladi (foydalanish qoidalari).
- **Communication Policy:** ilova ichida ko'rinadigan, tashqi PDF emas — qanday muloqot rasmiy hisoblanadi, qanday emas.

Sprint 1'da: statik matn + "Qabul qilaman" tugmasi bilan modal yetarli. Murakkab versiyalash yoki audit hozircha kerak emas.

---

## 6. UI Rules

### Layout (skelet — Sprint 1, Step 1)
```
┌─────────┬──────────────────────────────┬─────────┐
│         │           Topbar             │         │
│ Sidebar ├──────────────┬───────────────┤  Right  │
│         │  Chat Area   │               │  Panel  │
│         │              │               │         │
└─────────┴──────────────┴───────────────┴─────────┘
```
- **Sidebar:** Government Navigation (Viloyat → Tashkilot → Bo'lim → Workspace)
- **Topbar:** joriy workspace/kanal nomi, qidiruv, foydalanuvchi profili
- **Chat Area:** Telegram uslubidagi bubble'lar
- **Right Panel:** a'zolar ro'yxati / fayl/hujjatlar (kontekstga qarab)

### Sidebar — aniq ko'rinish namunasi (Tergov misolida)

```
🏛 Samarqand viloyati
━━━━━━━━━━━━━━
👮 Ichki Ishlar
   📂 Tergov
━━━━━━━━━━━━━━
📢 Kanallar
💬 Guruhlar
👥 Hodimlar
📁 Hujjatlar
✅ Vazifalar
📅 Kalendar
📊 Dashboard
━━━━━━━━━━━━━━
🗂 Ishlar
👤 Gumonlanuvchilar
📷 Dalillar
📜 Bayonnomalar
━━━━━━━━━━━━━━
💬 Shaxsiy chatlar
━━━━━━━━━━━━━━
⭐ Sevimlilar
━━━━━━━━━━━━━━
⚙ Sozlamalar
```

**Tuzilish qoidasi:** yuqorida joriy joylashuv (viloyat → tashkilot → bo'lim), o'rtada Universal modullar, keyin Maxsus modullar (bo'limga xos), pastda umumiy elementlar (Shaxsiy chatlar, Sevimlilar, Sozlamalar). Har doim shu tartib saqlanadi — Universal modullar doim Maxsus modullardan OLDIN ko'rsatiladi.

### Telegram uslubi (aniqlangan, `_sovereign.pcss`'da mavjud)
| Element | Qiymat |
|---|---|
| Sidebar background | `#17212b` |
| Chat canvas | `#0e1621` |
| Incoming bubble | `#182533` |
| Outgoing bubble | `#2b5278` |
| Accent/links | `#5288c1` |
| Avatar | Doira (`border-radius: 50%`) |
| Chat list item | 68px balandlik, 12px radius |

**Qat'iy qoida:** yangi komponent yozganda agent avval shu jadvaldagi ranglardan foydalanadi, o'zi yangi rang o'ylab topmaydi.

---

## 7. Design System

- Rang, shrift, spacing qoidalari yuqoridagi jadvaldan olinadi.
- Yangi rang/shrift kerak bo'lsa — avval shu faylga qo'shiladi, keyin kodda ishlatiladi (aksincha emas).
- Government branding (davlat logotipi, "Sovereign Messenger" nomi) har doim ko'rinadi — login sahifasi, sidebar yuqori qismi.

---

## 8. Coding Rules

- Sprint 1'da: **faqat ma'lumotlar qatlami fake** (`src/sovereign/demo/*.json`). UI, komponentlar, arxitektura — real, Element Web'ning o'zida, Sprint 2'da qayta yozilmaydi.
- Fake ma'lumotga to'g'ridan-to'g'ri emas, "data provider" hook'lar orqali murojaat qilinadi (§9'ga qarang) — Sprint 2'da Matrix API'ga almashtirish oson bo'lishi uchun.
- Permission tekshiruvi markazlashtirilgan **Permission Context** orqali amalga oshiriladi — har bir komponent o'zi `if (role === ...)` yozmaydi.
- Komponentlar kichik va bitta vazifali bo'ladi (Sidebar, WorkspaceNav, ChatArea alohida komponentlar, bitta ulkan fayl emas).
- Har bir Sprint 1 komponenti alohida topshiriq (task) sifatida beriladi — bir vaqtning o'zida bir nechta komponent yozilmaydi.
- Mavjud Element Web Component Architecture buziladigan hech qanday o'zgarish qilinmaydi (masalan, mavjud build config, routing tizimi, asosiy komponent konventsiyalari saqlanadi).

---

## 9. Folder Structure (Sprint 1 — Element Web monorepo ichida)

**Qaror (2026-08-01'da yangilandi):** Sprint 1 alohida standalone app sifatida EMAS, balki mavjud `frontend/element-web` monorepo ichida quriladi. Bu quyidagini anglatadi:

- UI, layout, komponentlar, loyiha arxitekturasi — **Element Web'ning o'zida**, uning mavjud Component Architecture'idan foydalanib rivojlantiriladi.
- **Faqat ma'lumotlar qatlami fake/static** — users, organization, channels, messages, tasks. UI kod darajasida "prototip" va "asosiy mahsulot" o'rtasida farq YO'Q — bitta kod bazasi, faqat ma'lumot manbai hozircha JSON, keyinchalik Matrix API bilan almashtiriladi.

```
frontend/element-web/apps/web/src/
  sovereign/                        ← Barcha davlat-loyihasiga xos yangi kod shu yerda,
    │                                  mavjud Element core kodidan ajratilgan papkada
    │                                  (yangilanishlarni birlashtirishni osonlashtirish uchun)
    ├── components/
    │   ├── layout/                 ← Sidebar, Topbar, RightPanel
    │   ├── navigation/              ← GovernmentNavigation, WorkspaceNavigation
    │   ├── chat/                    ← ChatArea, MessageBubble (Sprint 1'da fake data bilan;
    │   │                              Sprint 2'da asosiy Element timeline komponentlariga bog'lanadi)
    │   └── policy/                  ← PolicyModal
    ├── context/
    │   └── PermissionContext.tsx
    └── demo/                        ← FAQAT shu papka fake — Sprint 2'da olib tashlanadi
        ├── organization.json
        ├── users.json
        ├── channels.json
        ├── messages.json
        └── tasks.json
```

**Qat'iy qoida:** `src/sovereign/` tashqarisidagi mavjud Element Web kodiga (asosiy komponentlar, matrix-js-sdk chaqiruvlari, routing) Sprint 1 davomida tegilmaydi — faqat `src/sovereign/` ichida yangi kod yoziladi. Bu §2'dagi "protokol qatlamiga tegilmaydi" qoidasining kengaytmasi.

**Ma'lumot qatlami qoidasi:** Komponentlar `demo/*.json`'ni to'g'ridan-to'g'ri import qilmaydi — ular kichik "data provider" funksiyalar/hook'lar orqali o'qiydi (masalan `useOrganization()`, `useMessages()`). Bu Sprint 2'da fake JSON'ni real Matrix API chaqiruviga almashtirishda komponentlarni qayta yozishni talab qilmaydi — faqat provider funksiyaning ichi o'zgaradi.

**Dev rejimi:** Sprint 1 mavjud `dev.sh` / webpack-dev-server orqali ishlaydi — alohida Docker'siz "prototype" muhiti endi kerak emas.

### 9.1 App Bootstrap — `SOVEREIGN_MODE`

**Qaror (2026-08-01):** Sprint 1'da haqiqiy Matrix login ISHLATILMAYDI. Demo login faqat UI darajasida — foydalanuvchi `demo/users.json`'dan bir profilni tanlaydi, real `/login` API chaqiruvi bo'lmaydi.

```
frontend/element-web/apps/web/src/
  vector/
    app.tsx                       ← MAVJUD Element Web entry point — TEGILMAYDI, faqat
    │                                bitta shartli blok qo'shiladi (quyida)
  sovereign/
    SovereignDemoApp.tsx           ← Sprint 1'ning ildiz komponenti
    pages/
      DemoLogin.tsx                ← foydalanuvchi tanlash ekrani (real auth EMAS)
    components/ ... (§9'dagidek)
    context/
      PermissionContext.tsx
    demo/ ... (§9'dagidek)
```

**Ishga tushirish mexanizmi:** `vector/app.tsx` (mavjud, real Element Web entry point) ichiga kichik, shartli blok qo'shiladi:

```
agar SOVEREIGN_MODE flag true bo'lsa → <SovereignDemoApp /> render qilinadi
aks holda → mavjud Element Web (<MatrixChat />) odatdagidek ishga tushadi
```

**Qat'iy qoida:** `vector/app.tsx`'ga faqat shu shartli blok qo'shiladi — mavjud Element ishga tushirish logikasi (real login, MatrixClient yaratish, sync) hech qanday o'zgarishga uchramaydi. `SOVEREIGN_MODE` — build/dev vaqtidagi flag (masalan environment o'zgaruvchisi), ishlab chiqarish (production, real foydalanuvchilar uchun) build'ida har doim `false`/o'chirilgan bo'ladi.

**Sprint 2 migratsiya yo'li:** `SovereignDemoApp` ichidagi komponentlar birma-bir haqiqiy Element UI'ga (real `MatrixChat` oqimiga) ko'chiriladi — fake `demo/*.json` o'rniga haqiqiy Matrix API/SDK chaqiruvlari qo'yiladi (§9'dagi data-provider hook qoidasi shu almashtirishni osonlashtiradi). Migratsiya tugagach, `SOVEREIGN_MODE` flag va `sovereign/demo/` papkasi butunlay olib tashlanadi.

---

## 10. Agent Rules

1. Har ish boshlanishidan oldin `PROJECT_BLUEPRINT.md` va `PRODUCT_REQUIREMENTS.md` to'liq o'qiladi.
2. Agent bir vaqtning o'zida faqat BITTA aniq topshiriqni bajaradi (masalan: "Sprint 1, Task 1: Government Sidebar komponentini yarat"), butun UI'ni birdan yozmaydi.
3. Agar topshiriq shu hujjatda yozilmagan qarorni talab qilsa (masalan, yangi rang, yangi rol), agent TAXMIN QILMAYDI — savol beradi yoki shu faylga taklif sifatida yozib qo'yadi.
4. Har bir yangi komponent yaratilgach, u shu hujjatning tegishli bo'limiga (masalan, Folder Structure) mos kelishi tasdiqlanadi.
5. Hozirgi bosqichda TAQIQLANGAN: Auth (haqiqiy), Database, Notification, Encryption, Bots, Mobile, Voice, AI. Bularning birortasi so'ralsa ham, agent avval shu faylni ko'rsatib, "bu Sprint 1 doirasidan tashqarida" deb ogohlantiradi.

---

## 11. Kelajak Rejalari (Deferred, Not Forgotten)

Bu ro'yxat — unutilmasligi uchun yozib qo'yilgan, lekin Sprint 1'da QURILMAYDIGAN narsalar:

- Vaqtinchalik guruhlarning avtomatik arxivlanishi (masalan, "Operativ-17" operatsiya tugagach avtomatik arxivga o'tishi)
- Hujjatlar bo'limida version history
- Workspace sozlamalaridagi Audit Logs
- §3.1'dagi boshqa 10 ta tashkilot (Hokimlik, DXX, FVV, Sog'liqni Saqlash, Adliya, Soliq, IT, Ta'lim, Milliy Gvardiya, Prokuratura) uchun Maxsus modullarni to'liq qurish — hozircha faqat reference sifatida yozilgan
- Boshqa viloyatlarni Samarqand shabloni bo'yicha qo'shish
- Haqiqiy Auth, Database, Notification, Encryption, Bots, Mobile, Voice, AI (§10.5'da ham qayd etilgan)
- Digital approvals, davlat directory integratsiyasi, kalendar integratsiyasi, video konferensiya, AI yordamchi, workflow automation

**Qoida:** Bu ro'yxatdagi biror narsa "keling shuni ham qo'shamiz" tarzida so'ralsa, agent avval shu bo'limni ko'rsatadi va Sprint doirasi buzilishini ogohlantiradi.