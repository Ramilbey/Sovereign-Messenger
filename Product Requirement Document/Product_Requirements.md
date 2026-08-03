# PRODUCT_REQUIREMENTS.md — Sprint 1: Samarqand Pilot

**Munosabat:** Bu hujjat `PROJECT_BLUEPRINT.md`ga bo'ysunadi. Har qanday zid qarashda Blueprint ustun turadi.

---

## Sprint 1 Maqsadi

Samarqand viloyati → Ichki Ishlar → Tergov bo'limi uchun ishlaydigan, ko'rsatib bo'ladigan demo yaratish. **Element Web monorepo ichida, real UI arxitekturasi bilan quriladi — faqat ma'lumotlar qatlami (users, organization, channels, messages, tasks) fake/static.** Auth, database, real Matrix integratsiyasi hozircha yo'q (Sprint 2'ga qarang).

Sprint tugagach, quyidagilar ishlashi kerak:
- Demo login (`DemoLogin.tsx` — `demo/users.json`'dan profil tanlash, haqiqiy Matrix `/login` chaqiruvisiz), `SOVEREIGN_MODE` flag orqali `vector/app.tsx`'da ishga tushiriladi (Blueprint §9.1)
- Government sidebar (Samarqand → Ichki Ishlar → Tergov)
- Workspace ochilishi
- Kanallar, Guruhlar, Xodimlar ro'yxati
- Permission tizimi (rolga qarab UI farqi)
- Policy oynasi
- Telegram uslubidagi chat interfeysi
- Government branding

---

## Bajarish tartibi (ketma-ketlik qat'iy — oldingi bosqich tugamasdan keyingisiga o'tilmaydi)

### Step 1 — App Bootstrap & Demo Login
**Nima:** `vector/app.tsx`ga `SOVEREIGN_MODE` shartli bloki qo'shiladi (Blueprint §9.1); `SovereignDemoApp.tsx` yaratiladi (hozircha bo'sh/skelet); `DemoLogin.tsx` — `demo/users.json`'dan profil tanlash ekrani (hali `users.json` bo'sh/minimal bo'lishi mumkin, Step 5'da to'ldiriladi).
**Tayyor bo'lish mezoni:** `SOVEREIGN_MODE=true` bilan ishga tushirilganda `SovereignDemoApp` render bo'ladi, mavjud Element login oqimi ishga tushmaydi; profil tanlangач asosiy demo ekraniga (hali bo'sh) o'tiladi. Mavjud `vector/app.tsx`ning qolgan qismi o'zgarmagan qoladi.

### Step 2 — Layout Skeleton ⭐⭐⭐⭐⭐
**Nima:** Sidebar / Topbar / Workspace / Chat Area / Right Panel — faqat qutilar, hech qanday dizayn yo'q.
**Tayyor bo'lish mezoni:** Barcha 5 qism ekranda joyida ko'rinadi, bo'sh div'lar sifatida bo'lsa ham.
**Nima kerak emas:** rang, shrift, ikonka — hali yo'q.

### Step 3 — Government Navigation
**Nima:** Chap sidebar'da Samarqand → Ichki Ishlar → Tergov → Workspace ierarxiyasi bosilganda ochiladi/yopiladi.
**Tayyor bo'lish mezoni:** Foydalanuvchi sidebar'da bosib, Tergov workspace'iga yetib bora oladi.

### Step 4 — Workspace Navigation
**Nima:** Blueprint §3.2'dagi aniq modul ro'yxati bo'yicha Tergov Workspace'i:
- **Universal (9 ta):** 📢 Kanallar, 💬 Guruhlar, 👥 Xodimlar, 📁 Hujjatlar, ✅ Vazifalar, 📅 Kalendar, 📊 Dashboard, 📌 Pinned, ⚙ Workspace sozlamalari
- **Maxsus (5 ta, Tergov'ga xos):** 🗂 Ishlar, 👤 Gumonlanuvchilar, 📷 Dalillar, 📜 Bayonnomalar, ⚖ Sud materiallari

**Tayyor bo'lish mezoni:** Sidebar'da Blueprint §6'dagi aniq tartibda ko'rinadi (avval Universal, keyin Maxsus, keyin Shaxsiy chatlar/Sevimlilar/Sozlamalar). Har bir modul bosilganda tegishli (hozircha bo'sh yoki fake) kontent ko'rinadi. Dashboard va Workspace sozlamalari — faqat Manager/Rahbar rolida ko'rinadi (Step 6 bilan bog'liq).

### Step 5 — Fake Data
**Nima:** `frontend/element-web/apps/web/src/sovereign/demo/` papkasida alohida fayllar — `organization.json`, `users.json`, `channels.json`, `messages.json`, `tasks.json` (Blueprint §9). Minimal tarkib:
- **Rahbar:** Akmal Karimov (Manager roli)
- **Xodimlar (kamida 3 ta):** Sardor, Aziz, Diyor (Employee roli), har biriga status: 🟢 Ishda / 🟡 Yig'ilishda / 🔴 Band / ⚫ Offline
- **Kamida bitta National Admin** foydalanuvchi (rol testlash uchun, Tergov'ga bog'lanmasligi mumkin)
- **Kanallar:** E'lonlar, Buyruqlar, Favqulodda xabarlar, Haftalik reja, Yangiliklar
- **Guruhlar:** Umumiy, Operativ, Navbatchilik, Loyihalar
- **Bugungi vazifalar (fake):** Hisobot tayyorlash, Yig'ilish, Tekshiruv, Farmonni bajarish
- **Kalendar (fake):** 09:00 Yig'ilish, 11:00 Tekshiruv, 14:00 Viloyat yig'ilishi, 16:00 Hisobot topshirish
- **Dashboard (fake, faqat Rahbar ko'radi):** Online 18, Offline 5, Vazifalar 31, Bajarildi 26, Favqulodda 1

**Tayyor bo'lish mezoni:** Barcha yuqoridagi komponentlar shu JSON fayllardan **data provider hook'lar orqali** o'qiydi (Blueprint §9 — to'g'ridan-to'g'ri import emas), hardcode qilingan matn emas. `DemoLogin.tsx` (Step 1) endi to'liq `users.json`'dan o'qiydi.

### Step 6 — Permission System
**Nima:** `PermissionContext` — joriy login qilgan foydalanuvchi roliga qarab UI elementlari ko'rinadi/yashiriladi.
**Tayyor bo'lish mezoni:**
- Employee login qilsa → faqat Employee UI (boshqaruv tugmalari YO'Q, "disabled" ham emas — umuman yo'q)
- Manager login qilsa → boshqaruv tugmalari qo'shiladi (kanal yaratish, a'zo qo'shish), Dashboard va Workspace sozlamalari ko'rinadi
- National Admin login qilsa → to'liq UI
- **Kanallar darajasida:** Employee kanalda faqat o'qiy oladi, xabar yoza olmaydi (yozish maydoni ko'rsatilmaydi); Manager/National Admin yoza oladi (Blueprint §3.2, Kanallar ruxsat qoidasi)

### Step 7 — Policy Modal
**Nima:** Workspace birinchi marta ochilganda policy modal chiqadi ("Qabul qilaman" tugmasi bilan).
**Tayyor bo'lish mezoni:** Modal yopilgandan keyin qayta ochilmaydi (session davomida, real DB'siz — masalan React state yoki localStorage o'rniga in-memory state, chunki artifact muhitida localStorage ishlamaydi).

### Step 8 — Chat UI (Telegram uslubi)
**Nima:** `PROJECT_BLUEPRINT.md` §6'dagi ranglar va o'lchamlar bilan chat interfeysi — bubble'lar, avatar, xabar yozish maydoni.
**Tayyor bo'lish mezoni:** Fake xabarlar to'g'ri ko'rinadi, Blueprint'dagi rang kodlariga mos.

---

## Sprint 1 doirasidan TASHQARIDA (hozircha yozilmaydi)

❌ Auth (haqiqiy autentifikatsiya)
❌ Database
❌ Notification
❌ Encryption
❌ Bots
❌ Mobile versiya
❌ Voice/Video
❌ AI integratsiyasi

Agar shu vazifalardan biri so'ralsa, agent avval shu hujjatni ko'rsatishi va Sprint 1 doirasidan tashqarida ekanini aytishi kerak — o'zi qaror qabul qilib yozmaydi.

---

## Task Format (agentga qanday buyruq berish kerak)

To'g'ri:
> "Sprint 1, Task 1: Government Sidebar komponentini yarat."

Noto'g'ri:
> "UI yasab ber" / "Telegramga o'xshat"

Har bir topshiriq shu hujjatdagi Step raqamiga va tayyor bo'lish mezoniga aniq bog'langan bo'lishi kerak.

---

## Definition of Done — Sprint 1

- [ ] Step 1–8 barchasi tayyor bo'lish mezonlariga mos
- [ ] Uch xil rolda login qilib ko'rilgan (Employee, Manager, National Admin) va UI farqi ko'z bilan tasdiqlangan
- [ ] `PROJECT_BLUEPRINT.md`ga zid hech qanday dizayn qarori yo'q
- [ ] Demo sifatida boshqa odamga ko'rsatib bo'ladigan holatda

---

## Tech Constraints

Bu sprint faqat mavjud texnologiyalar asosida bajariladi:

- Element Web monorepo saqlanadi (Blueprint §9 — 2026-08-01 qarori: alohida standalone app emas).
- React + TypeScript ishlatiladi.
- Mavjud Component Architecture buzilmaydi.
- Matrix SDK o'zgartirilmaydi.
- Synapse o'zgartirilmaydi.
- Docker arxitekturasi o'zgartirilmaydi.
- Nginx routing saqlanadi.
- Yangi framework qo'shilmaydi.

---

## UI Scope

Sprint 1 maqsadi chiroyli dizayn emas. Maqsad:

- Layout ishlashi
- Navigation ishlashi
- Permission ishlashi
- Workspace ishlashi

Perfect UI keyingi sprintlarda qilinadi. Telegram uslubidagi ranglar (Step 7) — bu "chiroyli dizayn" emas, Blueprint §6'da allaqachon aniqlangan qiymatlarni qo'llash, demak Sprint 1 doirasida qoladi.

---

## Design Freeze

Sprint davomida yangi feature qo'shilmaydi. Faqat ushbu hujjatda yozilgan featurelar ishlab chiqiladi. Yangi g'oyalar Product Backlog'ga (kelajakdagi alohida hujjat) yoziladi, darhol amalga oshirilmaydi.

---

## Success Criteria (Sprint yakunlanganini tasdiqlash)

Sprint muvaffaqiyatli tugagan hisoblanadi, agar:

- [ ] Demo 5 daqiqa ichida ishlatib ko'rsatilsa
- [ ] Hech qanday qo'shimcha tushuntirish ("explain qilish") talab qilinmasa
- [ ] Foydalanuvchi UI'ni intuitiv tushunsa
- [ ] Sidebar ishlasa
- [ ] Permission ishlasa (uch rol o'rtasidagi farq ko'rinsa)
- [ ] Chat ishlasa (fake xabarlar bilan bo'lsa ham)

---

## Roadmap — keyingi sprintlar (reference, Sprint 1 doirasi emas)

| Sprint | Qamrov |
|---|---|
| **Sprint 2** | Matrix integration, real authentication, real rooms, real messages, database |
| **Sprint 3** | Encryption, Bots, Notification |
| **Sprint 4** | Government workflow, Audit, Analytics |

Bu jadval Blueprint §11 (Kelajak Rejalari) bilan mos — u yerda batafsilroq yozilgan. Har bir Sprint boshlanishidan oldin shu fayl (`PRODUCT_REQUIREMENTS.md`) o'sha Sprint uchun qayta yoziladi, xuddi Sprint 1 uchun qilingandek.