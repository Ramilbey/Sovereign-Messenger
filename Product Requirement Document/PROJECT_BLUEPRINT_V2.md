# Sovereign Messenger — Project Blueprint V2.1 (Enterprise Architecture Constitution)

**Hujjat Maqomi:** Yagona, O'zgarmas va Mutloq Haqiqat Manbai (Single Source of Truth & Architectural Constitution)  
**Tili:** O'zbek Tili  
**Sana:** 2026-08-04  
**Loyiha Darajasi:** Davlat Huquq-Tartibot va Maxfiy Idoralari Uchun Suveren Messenger Platformasi  

---

## 1. Loyiha Maqsadi va Falsafasi

**Sovereign Messenger** — O'zbekiston Respublikasi davlat idoralari, huquq-tartibot organlari va davlat xizmatchilari uchun mo'ljallangan rasmiy, yuqori xavfsizlikka ega, shifrlangan va suveren ichki muloqot platformasidir [cite: 4].

Loyiha jahon standarti bo'lmish **Matrix Synapse** server infratuzilmasi hamda **Element Web** frontend bazasi asosida quriladi [cite: 4]. Biroq, foydalanuvchi tajribasi (UX/UI) murakkab va texnik Element interfeysidan holi bo'lib, **Telegram** darajasida sodda, tezkor, interaktiv va tushunarli bo'lishi shart [cite: 4].

> **Muhim:** Bu loyiha shunchaki Telegram kloni yoki Element Web skin'i emas [cite: 4].  
> **Asosiy Maqsad:**
> 1. Davlat idoralari o'rtasida yagona va xavfsiz ichki aloqa tarmog'i (Intranet/Air-gapped) [cite: 4].
> 2. Kiberxavfsizlik va ma'lumotlar daxlsizligining yuqori darajasi [cite: 4].
> 3. Har qanday davlat xodimi uchun o'rganishga oson bo'lgan zamonaviy UI/UX [cite: 4].
> 4. Mavjud Matrix/Synapse ochiq protokoli imkoniyatlaridan maksimal foydalanish [cite: 4].

---

## 2. Besh Qatlamli Asosiy Arxitektura (5-Layer Architecture)

Sovereign Messenger loyihasi qat'iy ajratilgan **5 ta qatlam** (Layered Architecture) asosida ishlaydi [cite: 4]:

```
[ LAYER 1: UI Qatlami ] (React Components, Custom Workspace, ChatArea)
        ↓
[ LAYER 2: Context / Hooks Qatlami ] (PermissionContext, AuthContext, Custom Hooks)
        ↓
[ LAYER 3: Service Qatlami ] (MatrixClientService, MatrixMessageService, MatrixRoomService...)
        ↓
[ LAYER 4: Matrix JS SDK / Bridge ] (MatrixClientPeg, Client Reference, Event Emitters)
        ↓
[ LAYER 5: Synapse Server Infratuzilmasi ] (Homeserver, Postgres, Admin API)
```

### Layer Rules (Qatlam Qoidalari):
1. **Yo'nalishli Bog'liqlik:** Har bir qatlam faqat o'zidan keyingi (pastdagi) qatlamni biladi va u bilan muloqot qiladi [cite: 4].
2. **Qat'iy Izolyatsiya:** React komponentlari (Layer 1) **HECH QACHON** Matrix SDK (Layer 4) yoki Synapse API (Layer 5) bilan to'g'ridan-to'g'ri ishlamaydi [cite: 4].
3. **Inversion of Control:** Barcha biznes logika va ma'lumot transformatsiyasi faqat **Layer 3 (Service Layer)** ichida bajariladi [cite: 4].

---

## 3. Runtime Rejimlari (Runtime Modes)

Ilova atigi bitta mantiqiy bayroqcha (`SOVEREIGN_MODE`) orqali ikki xil ish rejimida ishlaydi [cite: 4].

### 3.1 Demo Mode (`SOVEREIGN_MODE=true`) — Investor & Offline Safety Net
* **Maqsadi:** Internet yoki Synapse serveri bo'lmagan holatda taqdimot qilish, investorlarga ko'rsatish, UI development hamda isolatsiyalangan regression testlar uchun [cite: 4].
* **Ishlash mexanizmi:** `demo/users.json`, `demo/messages.json`, `demo/channels.json` [cite: 4].
* **Qoida:** Real Matrix SDK va Synapse ulanishi bloklanadi [cite: 4]. Mock Provider'lar ishlaydi. Demo kodi va Provider'lari repository'dan **HECH QACHON O'CHIRILMAYDI** [cite: 4].

### 3.2 Production Mode (`SOVEREIGN_MODE=false`) — Real State
* **Maqsadi:** Real Synapse serveri bilan ishlash [cite: 4].
* **Ishlash mexanizmi:** Real Matrix Sync Stream, Synapse Authentication (`/login`), Real Rooms (Public, Private, DMs), Real-Time Timeline, Typing, Presence [cite: 4].
* **Qoida:** Demo JSON fayllari asosiy ish jarayonida umuman ishlatilmaydi [cite: 4].

---

## 4. Service Layer Topologiyasi va Arxitekturasi

Sprint 2 va undan keyingi bosqichlarda **Service Layer** quyidagi iyerarxik servislar zanjiri orqali ishlaydi [cite: 4]. Har bir servis faqat o'ziga yuklatilgan tor mas'uliyat doirasida (Single Responsibility Principle) faoliyat ko'rsatadi [cite: 4]:

```
[ SovereignConfig ] (Konfiguratsiyani saqlaydi)
        ↓
[ MatrixClientService ] (MatrixClient nusxasini saqlaydi va uzatadi)
        ↓
[ MatrixAuthService ] (Login va Logout amallarini bajaradi)
        ↓
[ SessionService ] (Access Token, Device ID va restore mantiqini boshqaradi)
        ↓
[ SessionBootstrapService ] (Sessiya tiklanganda ilovani yuklaydi)
        ↓
[ BootstrapCoordinator ] (Servislar va Sync ni ketma-ket ishga tushiradi)
        ↓
[ MatrixSyncService ] (Initial Sync va Event Stream tinglovchisi)
        ↓
[ MatrixRoomService ] (Kanallar, Guruhlar va DM xonalarni boshqaradi)
        ↓
[ MatrixTimelineService ] (Xabarlar tarixini yuklaydi va pagination qiladi)
        ↓
[ MatrixMessageService ] (Xabar yuborish va real-time qabul qilishni boshqaradi)
```

> **Eslatma:** Bu servislar Sovereign Messenger domenining **yagona va o'zgarmas biznes logikasidir** [cite: 4].

---

## 5. Yagona Matrix Client Tamoyili (Single Matrix Client Principle)

### Asosiy Qoida (Host Ownership Principle):
Runtime davomida faqat **bitta faol (authenticated) MatrixClient** instance mavjud bo'lishi kerak [cite: 4]. Uni yaratish huquqi **faqat Host Platformaga tegishli** (masalan, Hozir Element Web; kelajakda Electron yoki React Native Host) [cite: 4]. Sovereign Service Layer esa **hech qachon `createClient()` chaqirmaydi**; u faqat va faqat Host Platformadan ushbu client reference'ini qabul qilib oladi va undan foydalanadi [cite: 4].

```
[ Host Platform (Element Web / Electron / Mobile) ]
        ↓ (Authenticates & Creates Client Instance)
[ MatrixClientPeg / Host Container ]
        ↓ (Uzatadi)
[ MatrixClientService.setClient(client) ]
        ↓
[ Sovereign Service Layer ]
```

---

## 6. Matrix Client Bridge Arxitekturasi

Sovereign Messenger va Element Web (Host Platform) o'rtasidagi ko'prik **Matrix Client Bridge** deb ataladi [cite: 4].

```
[ Element Web (Lifecycle / Peg) ]
        ↓
  MatrixClientPeg
        ↓  (Bridge hodisalarni tinglaydi va client nusxasini uzatadi)
  MatrixClientBridge -> MatrixClientService.setClient(client)
        ↓
[ Sovereign Services (Message, Room, Timeline) ]
```

### Bridge Qoidalari:
1. Bridge faqat `MatrixClient` ob'ektining xotiradagi ko'rsatkichini (reference) uzatadi [cite: 4].
2. Bridge **hech qachon yangi client yaratmaydi** va tarmoq so'rovlarini (HTTP request) amalga oshirmaydi [cite: 4].
3. Bridge Host Platform hodisalariga (Events) obuna bo'ladi (`OnLoggedIn`, `OnLoggedOut`) [cite: 4].

---

## 7. Folder Structure (Loyiha Katalog Strukturasi)

Sovereign Messenger loyihasi kod bazasi quyidagi tartibda tashkillashtiriladi:

```text
src/
 └── sovereign/
      ├── bridge/         # Matrix Client Bridge va Host Event Adaptorlar
      ├── components/     # Sovereign Telegram UI Komponentlari (ChatArea, Sidebar)
      ├── config/         # SovereignConfig va muhit o'zgaruvchilari
      ├── context/        # React Contexts (PermissionContext, WorkspaceContext)
      ├── hooks/          # Custom React Hooks (useMessages, useRooms, useUsers)
      ├── providers/      # DI Providers (MatrixUserProvider, DemoUserProvider)
      ├── services/       # Core Business Services (MatrixClientService, MatrixMessageService...)
      ├── types/          # Domain Types, Interfaces va DTOlar
      └── utils/          # Helpers, Formatters va Enums
```

---

## 8. Dependency Rules (Bog'liqlik Qoidalari Matrixi)

Matritsa qat'iy yo'nalishli bog'liqlikni belgilaydi. Hech bir komponent qatlam o'tkazib ulanishga haqli emas:

| Qatlam (Source) | Components | Context / Hooks | Providers | Services | Matrix SDK |
|---|---|---|---|---|---|
| **Components** | ✅ (Child UI) | ✅ | ❌ | ❌ | ❌ |
| **Context / Hooks**| ❌ | ✅ | ✅ | ❌ | ❌ |
| **Providers** | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Services** | ❌ | ❌ | ❌ | ✅ | ✅ |

* **Qoida 1:** Components ❌ Services ni chetlab SDK ga chiqmaydi.
* **Qoida 2:** Hooks ❌ Matrix SDK ni to'g'ridan-to'g'ri import qilmaydi.
* **Qoida 3:** Faqat **Services Layer** ✅ Matrix SDK bilan ishlashga ruxsat etiladi.

---

## 9. Full Sprint Roadmap

* 🟢 **Sprint 1 (Demo UI & Architecture Foundation):**
  * Telegram-style UI, Workspace Components, Demo Providers (JSON), Dynamic Permission Context foundation [cite: 4].
* 🟡 **Sprint 2 (Matrix Synapse Integration — CURRENT):**
  * MatrixClientBridge, Real Login, Session Restore, Real Rooms & Timeline Sync, Live Messaging, National Admin User Management (Synapse Admin API) [cite: 3, 4].
* ⚪ **Sprint 3 (Real-Time Status & Attachments):**
  * Typing Indicators, Presence (Online/Offline), Read Receipts, File Uploads/Downloads (MXC) [cite: 3, 4].
* ⚪ **Sprint 4 (Enhanced Security & Push Notifications):**
  * End-to-End Encryption (E2EE), Push Notifications (Matrix Sygnal/UnifiedPush), Audit Trail Logs [cite: 3].
* ⚪ **Sprint 5 (Media Calls & Government Workflow):**
  * Voice & Video Calls (Matrix RTC / Element Call), Government Workflow Engine & Document Approvals [cite: 3].

---

## 10. Architectural Decision Records (ADR)

### ADR-001: Nega Matrix Protokoli Tanlandi?
* **Kontekst:** Davlat tashkilotlari uchun xavfsiz va mustaqil aloqa kerak.
* **Qaror:** Matrix protokoli tanlandi. Chunki u ochiq standart, federativ (vazirliklar saqlangan holda bog'lanadi) va ma'lumotlarni 100% davlat xususiy serverlarida (On-Premise Synapse) saqlashga imkon beradi.

### ADR-002: Nega Element Web Baza Sifatida Tanlandi?
* **Kontekst:** Ishonchli, yillar davomida sinovdan o'tgan Matrix client arxitekturasi kerak edi.
* **Qaror:** Element Web tanlandi. U barcha xavfsizlik, session va SDK logikasiga ega. sovereign moduli uning ustiga qatlam (adapter/layer) sifatida o'rnatiladi.

### ADR-003: Nega Telegram UI Yaratildi?
* **Kontekst:** Element Web interfeysi oddiy davlat xodimi uchun murakkab va noqulay.
* **Qaror:** Element UI o'rniga Telegram uslubidagi o'ta sodda, intuitiv va tezkor Sovereign UI yaratildi. Foydalanuvchi murakkab texnik sozlamalarni ko'rmaydi.

### ADR-004: Nega Demo Mode (`SOVEREIGN_MODE`) O'chirilmaydi?
* **Kontekst:** Matrix server uzilgan hollarda yoki taqdimotlarda ilova ishlamay qolishi mumkin [cite: 4].
* **Qaror:** Demo Mode permanent rejim sifatida saqlanadi [cite: 3, 4]. Investorlar taqdimoti va offline testlar uchun `SOVEREIGN_MODE=true` har doim ishchi holatda qoladi [cite: 3, 4].

### ADR-005: Nega Single Matrix Client Principle Ishlatiladi?
* **Kontekst:** Qo'shimcha client instance'lar xotira ketishiga (memory leak) va sync ziddiyatlariga olib keladi.
* **Qaror:** Ilovada faqat bitta autentifikatsiyadan o'tgan client reference saqlanadi va barcha sovereign servislar o'sha bitta reference orqali ishlaydi [cite: 4].

---

## 11. Coding Standards & Naming Conventions

1. **Singleton Pattern:** Barcha Service Layer ob'ektlari (`MatrixClientService`, `MatrixMessageService`) Singleton bo me'yorida yaratiladi va faqat bitta eksport qilingan instance'ga ega bo'ladi.
2. **Interface vs Type:** 
   * Domen ma'lumot modellari uchun: `interface` (masalan: `interface SovereignUser`).
   * State, Union va Type Aliases uchun: `type` (masalan: `type RoomType = 'channel' | 'group' | 'dm'`).
3. **Naming Conventions:**
   * **Services:** `Matrix[Domain]Service.ts` (masalan: `MatrixMessageService.ts`).
   * **Providers:** `[Domain]Provider.tsx` (masalan: `MatrixUserProvider.tsx`).
   * **Hooks:** `use[Domain].ts` (masalan: `useMessages.ts`).
   * **Context:** `[Domain]Context.tsx` (masalan: `PermissionContext.tsx`).
4. **Error Handling Standard:** Servislar xatoliklarni yutib yubormaydi; xatoliklar maxsus `SovereignError` tipida context/UI qatlamiga uzatiladi va Toast notification orqali ko'rsatiladi [cite: 3].

---

## 12. Sequence Diagrams (Matnli Ketma-ketlik Diagrammalari)

### 12.1 Authentication & Session Bridge Sequence
```text
[ User ] ──► [ Element Login UI ]
                   │
                   ▼ (Authenticates)
            [ Lifecycle.doSetLoggedIn() ]
                   │
                   ▼ (Sets Global Instance)
            [ MatrixClientPeg.set(client) ]
                   │
                   ▼ (Fires Event: Action.OnLoggedIn)
            [ MatrixClientBridge ]
                   │
                   ▼ (Passes Reference)
            [ MatrixClientService.setClient(client) ]
                   │
                   ▼ (Triggers Initialization)
            [ BootstrapCoordinator.init() ] ──► [ Sovereign Workspace UI ]
```

### 12.2 Message Sending Sequence
```text
[ User ] ──► [ MessageComposer UI ]
                   │
                   ▼ (Calls hook)
            [ useMessages() Hook ]
                   │
                   ▼ (Dispatches Action)
            [ MatrixMessageProvider ]
                   │
                   ▼ (Delegates to Service)
            [ MatrixMessageService.sendMessage(roomId, text) ]
                   │
                   ▼ (Uses Authenticated Reference)
            [ MatrixClient.sendEvent(roomId, "m.room.message", ...) ]
                   │
                   ▼ (HTTPS / WS Stream)
            [ Synapse Server Infrastructure ]
```

---

## 13. Hozirgi Mavjud Tizimli Muammo va Tahlil

### Muammo Simptomi:
Foydalanuvchi Element Login oynasidan muvaffaqiyatli o'tsa-da, chat orqali xabar yuborishda quyidagi xatolik yuzaga kelmoqda [cite: 4]:
```text
Cannot send message: MatrixClient is not authenticated.
MatrixClientService.getClient() -> null
```

### Sababi (Root Cause Analysis):
Element Web tizimga kirganda `Lifecycle.doSetLoggedIn()` orqali `MatrixClientPeg.set(client)` bajariladi, lekin `MatrixClientBridge` bo'lmagani uchun Sovereign Messenger'ning `MatrixClientService` ob'ekti bu holatdan bexabar qoladi [cite: 4]. Natijada `MatrixClientService.getClient()` har doim `null` qaytaradi [cite: 4].

---

## 14. Darhol Bajariladigan Vazifa (Bridge Integration)

Ushbu uzilishni bartaraf etish uchun `MatrixClientBridge` ulagichi o'rnatiladi [cite: 4]:

```typescript
// Login hodisasi ro'y berganda (Action.OnLoggedIn)
MatrixClientBridge.on('logged_in', () => {
    const activeClient = MatrixClientPeg.get();
    if (activeClient) {
        MatrixClientService.setClient(activeClient);
        BootstrapCoordinator.init();
    }
});

// Logout hodisasi ro'y berganda (Action.OnLoggedOut)
MatrixClientBridge.on('logged_out', () => {
    MatrixClientService.clearClient();
    SessionService.clear();
});
```

---

## 15. Agent va Dasturchilar Uchun Qat'iy Qoidalar (Agent Rules)

Ushbu loyihada ishlovchi har qanday AI Agent yoki Dasturchi quyidagi **5 ta Oltin Qoidaga** so'zsiz rioya qilishi shart [cite: 4]:

1. **Single Source of Truth:** Barcha texnik va arxitekturaviy qarorlar ushbu `PROJECT_BLUEPRINT_V2.md` hujjatiga muvofiq bo'lishi kerak [cite: 4].
2. **No Direct SDK Import in UI:** UI qatlamida `matrix-js-sdk` modullarini import qilish taqiqlanadi [cite: 4].
3. **No Duplicate Client Creation:** Aslo yangi `createClient()` yaratilmasin [cite: 4]. Client har doim Host Ownership tamoyili bo'yicha Bridge orqali olinadi [cite: 4].
4. **Preserve Demo Mode:** Demo Provider'lar va `SOVEREIGN_MODE=true` mantiqiga teyilmasin va koddan o'chirilmasin [cite: 3, 4].
5. **Phase-by-Phase Delivery:** Har bir o'zgarish kichik va tekshiriluvchi (validated) qadamlar bilan amalga oshirilsin [cite: 3, 4].