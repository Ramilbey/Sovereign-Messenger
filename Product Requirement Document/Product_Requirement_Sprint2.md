# Sovereign Messenger — Product Requirements Document (PRD)
## Sprint 2: Matrix / Synapse Integration (Final Enterprise Edition)

**Hujjat Maqomi:** Tasdiqlangan va Yakuniy (Production Master Standard)  
**Munosabat:** Ushbu hujjat `PROJECT_BLUEPRINT.md` ga bo'ysunadi. Blueprint ustun hisoblanadi.  
**Sana:** 2026-08-03  

---

## 1. Executive Summary & Strategy

Sprint 1 davomida qurilgan barcha UI va Component Architecture to'liq saqlanadi.  
**Sprint 2 maqsadi** — fake data qatlamini bosqichma-bosqich haqiqiy Matrix/Synapse infratuzilmasi bilan almashtirish (Data Layer & Service Layer Migration).

### Key Execution Strategy (Bosqichma-bosqich bajarish):
Sprint 2 birdaniga parallel emas, balki belgilangan 11 ta Phase bo'yicha **ketma-ket va bosqichma-bosqich** amalga oshiriladi. Avval har bir Phase to'liq topshirilib, barqarorligi tasdiqlangach (Phase Validation), keyingi Phase-ga o'tiladi.

---

## 2. Architecture Principles & Layer Separation

Architecture saqlanadi va mas'uliyatlar qat'iy ajratiladi:

```
[ UI Layer ]
  ↓
[ Context Layer ]  (e.g., PermissionContext, AuthContext)
  ↓
[ Provider Layer ] (e.g., MatrixUserProvider, MatrixRoomProvider)
  ↓
[ Service Layer ]  (e.g., MatrixClientService, MatrixAdminService)
  ↓
[ Matrix SDK / Synapse Admin API (via Reverse Proxy) ]
  ↓
[ Synapse Server Infrastructure ]
```

> **Aksiyoma:** UI hech qachon Matrix SDK yoki Admin API bilan to'g'ridan-to'g'ri ishlamaydi. Barcha o'zaro ta'sirlar Service va Provider qatlamlari orqali o'tadi.

---

## 3. Provider & Service Migration Map

### 3.1 Service Layer Migration
* `DemoLoginService` → **`MatrixAuthService`**
* `DemoMessageService` → **`MatrixMessageService`**
* `DemoRoomService` → **`MatrixRoomService`**
* `DemoUserService` → **`MatrixUserService`**
* *Yangi Qo'shiladigan Service:* **`MatrixAdminService`** (Synapse Admin API bilan ishlash uchun alohida)

### 3.2 Provider Layer Migration
* `useUsers()` → `DemoUserProvider` → **`MatrixUserProvider`** → `MatrixUserService`
* `useRooms()` → `DemoRoomProvider` → **`MatrixRoomProvider`** → `MatrixRoomService`
* `useMessages()` → `DemoMessageProvider` → **`MatrixMessageProvider`** → `MatrixMessageService`

---

## 4. Architectural Specifics & Specifications

### 4.1 Demo Mode Runtime Strategy (Investor Safety Net)
* **Demo Mode is a permanent supported runtime.** Demo kodi va Provider'lari repository'dan **HECH QACHON O'CHIRILMAYDI**.
* Demo Mode investorlar namoyishi, internet/server uzilgan holatda taqdimot qilish, UI development hamda regression testlar uchun permanent rejim sifatida saqlanadi.

### 4.2 Matrix Admin API Architecture Note
* Matrix Admin API oddiy foydalanuvchi access tokeni bilan ishlamaydi.
* `MatrixAdminService` Synapse Admin API bilan muloqot qilish uchun **alohida administrator credential** yoki **reverse-proxy orqali himoyalangan backend endpoint/token** orqali ishlaydi.

### 4.3 Role Storage Source Specification
* Matrix foydalanuvchilarining rollari (`Employee`, `Manager`, `National Admin`) va bo'lim ma'lumotlari (`Department`) Matrix **User Account Data** (`m.identity.role`) va **Room Power Levels** orqali saqlanadi va `MatrixUserService` yordamida `CurrentUser` ga o'tkaziladi.

### 4.4 Matrix Room Types Mapping Table

| Sovereign UI Component | Matrix Room Type / Implementation | Technical Details |
|---|---|---|
| **Official Channel** | Public Room (`visibility: public`) | Barcha foydalanuvchilar ko'ra oladi, faqat Admin/Manager yozadi. |
| **Group** | Private Room (`visibility: private`) | Taklifnoma (invite) orqali kiriladi. |
| **Direct Chat** | Direct Message (DM Room, `is_direct: true`) | Ikki foydalanuvchi o'rtasidagi shaxsiy chat. |
| **Workspace Tag** | Room Tag / Space (`m.space`) | Kanallar va guruhlarni guruhlash uchun Matrix Space. |

### 4.5 Attachment Strategy
* **Sprint 2 Scope:** Attachment upload/download funksiyalari **Sprint 3 ga qoldirildi (Deferred to Sprint 3)**. Sprint 2 faqat matnli va real-time holatlarni boshqaradi.

---

## 5. Matrix Sync Lifecycle

```
[ Login / Restore Session ]
  ↓
[ Start Matrix Sync Client ]
  ↓
[ Initial Sync ] (Fetch initial state)
  │   └─► Failure? Retry Initial Sync Loop
  ↓
[ Sync Event Stream ]
  ├─► Sync Rooms (Channels / Groups / DMs)
  ├─► Sync Timeline (Messages)
  ├─► Sync Presence (Online / Offline)
  └─► Sync Typing Indicators
```

---

## 6. Implementation Phases (Step-by-Step Execution Plan)

### PHASE 0 — Infrastructure Validation (BIRINCHI QADAM)
* **Task 0.1:** Docker va Nginx container'lari sog'lom (healthy) ekanligini tasdiqlash.
* **Task 0.2:** Synapse Server va Postgres DB sog'ligini tekshirish.
* **Task 0.3:** Synapse Homeserver client va admin API endpoint'larining ochiqligini (reachable) tasdiqlash.

### PHASE 1 — Matrix Foundation
* **Task 1.1:** `MatrixClientService` yaratish (`createClient()` → client instance).
* **Task 1.2:** Homeserver configuration (`config.json` → Matrix Client).
* **Task 1.3:** Demo / Production Mode ajratish (`SOVEREIGN_MODE` toggle).

### PHASE 2 — Authentication
* **Task 2.1:** Real Login Screen integratsiyasi.
* **Task 2.2:** Matrix `/login` API integratsiyasi (`MatrixAuthService` orqali).
* **Task 2.3:** Login Error Handling.
* **Task 2.4:** Logout funksionalligi (Sync Client to'xtatish va tokenlarni tozalash).

### PHASE 3 — Session Management
* **Task 3.1:** Access Token Storage (`access_token`, `device_id`, `homeserver`, `user_id`).
* **Task 3.2:** Restore Session (Ilovalar qayta ochilganda token orqali tiklash).
* **Task 3.3:** Auto Login (Sync ni ishga tushirish va workspace ga o'tish).

### PHASE 4 — Current User Data Layer & Role Mapping
* **Task 4.1:** Matrix Profile va User Account Data fetching.
* **Task 4.2:** User Data Transformation (`Matrix Profile + Account Data` → `CurrentUser`).

### PHASE 5 — Real Rooms & Mapping
* **Task 5.1:** Sync Stream orqali roomlarni olish (`channels.json` o'rniga).
* **Task 5.2:** Public Rooms → Official Channels mapping.
* **Task 5.3:** Private Rooms → Groups mapping.
* **Task 5.4:** Direct Messages (DM) va Room Switching.

### PHASE 6 — Messaging & Real-Time Sync
* **Task 6.1:** Timeline (Matrix SDK event listener orqali xabarlar tarixini yuklash).
* **Task 6.2:** Pagination (`backPaginate` orqali eski xabarlarni yuklash).
* **Task 6.3:** Live Updates (Real-vaqt xabar yangilanishi).
* **Task 6.4:** Message Sending (Composer → `MatrixMessageService` → Timeline).
* **Task 6.5:** Typing Indicator.
* **Task 6.6:** Presence (Online/Offline status).
* **Task 6.7:** Read Receipts.

### PHASE 7 — Administration Layer (National Admin)
* **Task 7.1:** Administration Workspace UI integratsiyasi.
* **Task 7.2:** Create User → `MatrixAdminService` → Synapse Admin API.
* **Task 7.3:** Delete / Deactivate User.
* **Task 7.4:** Reset Password.
* **Task 7.5:** Enable / Disable User.
* **Task 7.6:** Assign Role & Department (`m.identity.role` Account Data orqali).
* **Task 7.7:** User Search & Filtering.

### PHASE 8 — Room Administration (Manager & National Admin)
* **Task 8.1:** Create Channel (Public Room).
* **Task 8.2:** Delete Channel.
* **Task 8.3:** Create Group (Private Room).
* **Task 8.4:** Invite User / Remove User (Kick).
* **Task 8.5:** Assign Moderator (Matrix Power Levels bo'yicha).

### PHASE 9 — Refactoring & Demo Retention
* **Task 9.1:** Demo Provider’larni `deprecated` deb belgilash, lekin kod bazasida to'liq saqlab qolish.
* **Task 9.2:** Production Mode uchun Matrix Provider’larni default sozlash.
* **Task 9.3:** `SOVEREIGN_MODE` toggle mexanizmini sinovdan o'tkazish.

### PHASE 10 — Testing & Quality Assurance
* **Task 10.1:** Authentication Tests (Login, Logout, Session Restore).
* **Task 10.2:** Room Tests (Kanal/Guruh/DM yaratish va o'tish).
* **Task 10.3:** Messaging Tests (Real-time yozishmalar, Typing, Pagination).
* **Task 10.4:** Permission Tests (Employee, Manager, Admin roliga mos ruxsatlar).
* **Task 10.5:** Cross-Browser Real-Time Tests.
* **Task 10.6:** Regression Testing (Sprint 1 UI buzilmaganligini tekshirish).

---

## 7. Step-by-Step Requirements & Responsibilities

| Step | Modul | Responsibility & Pipeline | Natija (Definition of Done) |
|---|---|---|---|
| **Step 0** | Infrastructure | Infrastructure Health Check → Docker/Synapse | Synapse va Nginx ishchi holatda. |
| **Step 1** | Matrix Authentication | `Login UI` → `MatrixAuthService` → Matrix `/login` API | Real Login ishlaydi, Access Token saqlanadi. |
| **Step 2** | Session Management | `App Launch` → `Restore Session` → `Auto Login` | Refresh qilinganda login oynasi chiqmaydi. |
| **Step 3** | Current User | `Matrix Profile + Account Data` → `CurrentUser` | CurrentUser ob'ekti va rollari to'ladi. |
| **Step 4** | Real Rooms | `Sync Stream` → `MatrixRoomProvider` → `Workspace UI` | Public/Private va DM xonalar ko'rinadi. |
| **Step 5** | Real Messages | `Timeline Stream` → `MatrixMessageProvider` → `ChatArea` | Real xabarlar va pagination ishlaydi. |
| **Step 6** | Message Sending | `Composer` → `MatrixMessageService` → `Matrix SDK` | Xabar real-vaqtda barcha mijozlarga yetib boradi. |
| **Step 7** | Presence & Typing | `Presence Events` → `Matrix SDK` → `Status UI` | Online status va typing indicator ishlaydi. |
| **Step 8** | National Admin | `Admin UI` → `MatrixAdminService` → `Synapse Admin API` | Admin yangi xodim yaratadi va boshqaradi. |
| **Step 9** | Room Management | `Manager UI` → `MatrixRoomService` → `Power Levels` | Manager va Admin roomlarni boshqaradi. |
| **Step 10**| Permission Evaluation | `CurrentUser` → `PermissionContext` → `Action Guards` | UI ruxsatlari dinamik boshqariladi. |

---

## 8. Error Handling & Resilience Strategy

* **Network Lost:** `Matrix SDK` reconnect loop-ga o'tadi, UI-da "Reconnecting..." indikatori chiqadi.
* **Initial Sync Failed:** SDK avtomatik 3 marta qayta urinadi (`Retry Initial Sync`).
* **Token Expired / Invalid Session:** Tokenlar tozalanadi va foydalanuvchi Login ekraniga o'tkaziladi.
* **Server Offline:** Global banner: *"Server bilan aloqa uzildi. Offline rejimdasiz."*
* **Permission Denied:** UI-da Toast xabari: *"Ushbu amalni bajarish uchun ruxsatingiz yetarli emas."*

---

## 9. Future Proof Guarantee (Sprint 3 Compatibility)

* 🔒 **End-to-End Encryption (E2EE):** Faqat `MatrixMessageService` va SDK darajasida kalitlar boshqaruvi qo'shiladi.
* 📎 **Attachment Upload/Download:** Matrix Content Repository (MXC) orqali `MatrixMessageService`-ga kiritiladi.
* 🤖 **Bots & Integration:** Xabarlar va xonalarni qayta ishlash servislariga hook sifatida ulana oladi.
* 🔔 **Push Notifications:** Provider darajasida push event tinglovchilari qo'shiladi.

---

## 10. Technical Constraints & Stack

* **Component Architecture:** Saqlanadi.
* **Framework:** React, TypeScript.
* **SDK & Protocol:** Matrix JS SDK, Synapse Admin API.
* **Infratuzilma:** Docker, Nginx, PostgreSQL, Synapse.
* **Design Patterns:** Dependency Injection, Provider Pattern, Component Architecture.

---

## 11. Success Criteria & Definition of Done (DoD)

1. 🟢 **Phase 0 Validated:** Infratuzilma (Synapse/Docker) to'g'ri va sog'lom ishlamoqda.
2. 🟢 **Demo Mode (`SOVEREIGN_MODE=true`):** Permanent rejim sifatida 100% muammosiz ishlaydi.
3. 🟢 **Production Mode (`SOVEREIGN_MODE=false`):** Synapse serveri bilan to'liq va xatosiz ishlaydi.
4. 🟢 **Matrix Login & Session Restore:** Brauzer yangilanganda sessiya saqlanib qoladi.
5. 🟢 **Sync Lifecycle:** Initial Sync va real-time Stream Sync barqaror ishlaydi.
6. 🟢 **Real-time Messaging:** Ikki brauzer real vaqtda xabar almashadi.
7. 🟢 **National Admin:** Synapse Admin API yordamida `MatrixAdminService` orqali foydalanuvchilar to'liq boshqariladi.
8. 🟢 **Permission System:** `CurrentUser` holatidan `PermissionContext` orqali UI ruxsatlari dinamik boshqariladi.
9. 🟢 **Error Handling & Resilience:** Tarmoq uzilishi, Sync xatosi va sessiya tugashi to'g'ri qayta ishlanadi.
10. 🟢 **Testing:** Phase 10 dagi barcha test stsenariylari muvaffaqiyatli o'tgan.