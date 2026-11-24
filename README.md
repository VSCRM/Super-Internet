# Super-Internet — Клієнтський портал

<p align="center">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript" />
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" />
  <img alt="Tests" src="https://img.shields.io/badge/tests-112%20passing-brightgreen" />
  <img alt="API docs" src="https://img.shields.io/badge/API%20docs-OpenAPI%203.0-85EA2D?logo=swagger&logoColor=black" />
  <a href="./LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-green" /></a>
</p>

Курсова робота (2 курс). Односторінковий React 19 + TypeScript застосунок для інтернет/ТБ-провайдера: маркетинговий лендинг і рольовий особистий кабінет (Клієнт / Підтримка / Адміністратор) з автентифікацією, білінгом, керуванням обладнанням та чатом підтримки.

**Примітка:** Це повна переробка під TypeScript + React. Якщо вам потрібна стара версія (HTML5 + CSS3 + Vanilla JS), дивіться у гілці [old-version](https://github.com/VSCRM/Super-Internet/tree/old-version).

**🔗 Демо:** [https://vscrm.github.io/Super-Internet/](https://vscrm.github.io/Super-Internet/)

**📦 Репозиторій:** [https://github.com/VSCRM/Super-Internet](https://github.com/VSCRM/Super-Internet)

**📘 API-документація (Swagger/OpenAPI):** [https://vscrm.github.io/Super-Internet/api](https://vscrm.github.io/Super-Internet/api) — інтерактивний Swagger UI, специфікація — [public/api/openapi.yaml](./public/api/openapi.yaml) (докладніше у розділі [Документація API](#документація-api)).

---

## Зміст

- [Super-Internet — Клієнтський портал](#super-internet--клієнтський-портал)
  - [Зміст](#зміст)
  - [Можливості](#можливості)
  - [Технологічний стек](#технологічний-стек)
  - [Архітектура](#архітектура)
    - [Патерни проєктування](#патерни-проєктування)
    - [Шарування](#шарування)
  - [Швидкий старт](#швидкий-старт)
  - [Змінні середовища](#змінні-середовища)
  - [Робота з бекендом](#робота-з-бекендом)
  - [Скрипти](#скрипти)
  - [Тестування](#тестування)
  - [Документація API](#документація-api)
  - [Деплой](#деплой)
  - [Структура проєкту](#структура-проєкту)
  - [Безпека](#безпека)
  - [Продуктивність](#продуктивність)
  - [Автор](#автор)
  - [Ліцензія](#ліцензія)

---

## Можливості

**Клієнт**

- Реєстрація/вхід з real-time Zod-валідацією (email, пароль, телефон); у режимі бекенду
  ще й вхід через Google
- Вибір послуги (Інтернет / Інтернет + ТБ), договір з незмінним ID обладнання. Із бекендом
  ПІБ і телефон для договору беруться з профілю, а для Google-акаунта (де їх немає) —
  запитуються при оформленні
- Оплата (Mock: mock-шлюз або PrivatBank-контракт; з бекендом платіж проводить сам бекенд),
  регулярні платежі
- Чат з підтримкою (з бекендом — живий, оновлюється раз на 5 с, без автовідповіді)
- Відновлення пароля через email-код: Mock — EmailJS, бекенд — код надсилає (або логує) він сам

**Підтримка**

- Черга звернень, відсортована так, щоб непрочитане ніколи не губилось на іншій сторінці
- Перегляд і редагування договору клієнта (ID обладнання — тільки читання)
- Підтвердження підключення та зміна статусу обладнання

**Адміністратор**

- Керування персоналом підтримки (з бекендом новому співробітнику потрібні телефон і ПІБ
  з трьох слів), видалення співробітників і клієнтів
- Моніторинг і підтвердження підключення обладнання (з пагінацією)
- Список клієнтів (з пагінацією)

**Наскрізне**

- Захист від брутфорсу на вхід і код відновлення пароля (лок-аут після 5 спроб)
- ErrorBoundary — рендер-помилка не кладе весь застосунок білим екраном
- Доступні модалки: focus trap, Escape, `role="dialog"`/`aria-modal`
- Режим бекенду: Bearer-JWT, обробка завершення сеансу (`401` → екран входу), зрозумілі
  повідомлення, коли бекенд недоступний
- Дві мови (uk/en) з перемикачем в шапці — реально працює, включно з повідомленнями
  валідації форм, не лише зі статичним текстом

## Технологічний стек

|                      |                                         |
| -------------------- | --------------------------------------- |
| **Мова**             | TypeScript (strict mode, без `any`)     |
| **UI**               | React 19, SASS Modules (BEM)            |
| **Валідація**        | Zod                                     |
| **Локалізація**      | i18next / react-i18next (uk, en)        |
| **Роутинг**          | React Router                            |
| **Збірка**           | Vite                                    |
| **Тести**            | Vitest + Testing Library                |
| **Лінт**             | ESLint (typescript-eslint, react-hooks) |
| **HTTP-клієнт**      | axios (Bearer-JWT до Spring-бекенду)    |
| **API-документація** | OpenAPI 3.0 (`public/api/openapi.yaml`) |

## Архітектура

### Патерни проєктування

- **Strategy** — `AuthStrategy` (`LocalAuthStrategy` для Mock-режиму, `ApiAuthStrategy` —
  вхід через Spring-бекенд: Bearer-JWT і Google OAuth2)
- **Двоє провайдерів стану** — `AppProvider` обирає `LocalAppProvider` (Mock, localStorage)
  або `BackendAppProvider` (REST) за `VITE_BACKEND_MODE`; обидва віддають один і той самий
  `AppContextValue`, тож компоненти не знають, що саме активне
- **Repository** — `UserRepository` (`LocalUserRepository` для Mock-режиму; `ApiUserRepository`
  — лише заглушка, не використовується: у режимі бекенду `BackendAppProvider` ходить в API
  напряму через `services/api`)
- **Factory** — `authStrategyFactory`, `userRepositoryFactory`, `paymentGatewayFactory`,
  `emailServiceFactory`, `passwordRecoveryServiceFactory` — решта коду просить "поточну
  реалізацію", не знаючи, яка саме активна
- **Composition root** — кожен дашборд (`ClientDashboard`, `AdminDashboard`,
  `SupportDashboard`) лише збирає докупи однопрофільні хуки/компоненти, не містить
  бізнес-логіки сам

### Шарування

Кожен файл під `context/` і `components/PersonalAccount/` відповідає за одну дію чи
один таб. `services/` — інтеграційні межі із зовнішнім світом (auth, платежі, email,
дані). `shared/` — код без залежності від React (валідація, утиліти, конфіг). Повне
дерево — у розділі [Структура проєкту](#структура-проєкту).

## Швидкий старт

Вимоги: Node.js ≥ 20.

```bash
git clone https://github.com/VSCRM/Super-Internet.git
cd Super-Internet
npm install
cp .env.example .env
npm run dev
```

`.env` опційний — застосунок повністю працює й без нього (Mock-режим за замовчуванням).

Застосунок відкриється на `http://localhost:5173/Super-Internet/`. Без `.env` усе
працює проти локального Mock-шару (localStorage) — бекенд не потрібен.

**Тестові акаунти** (створюються автоматично при першому запуску, лише в Mock-режимі):

| Роль          | Email             | Пароль     |
| ------------- | ----------------- | ---------- |
| Адміністратор | admin@super.net   | admin123   |
| Підтримка     | support@super.net | support123 |

## Змінні середовища

Повний список — у [.env.example](./.env.example). Коротко:

| Змінна                                                     | За замовчуванням        | Призначення                                                                                       |
| ---------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------- |
| `VITE_BACKEND_MODE`                                        | `false`                 | `true` → бекенд; `false` → локальний Mock                                                         |
| `VITE_API_BASE_URL`                                        | `/api`                  | Базовий шлях JSON API. `/api` проксіюється Vite на `VITE_BACKEND_ORIGIN` (без CORS)               |
| `VITE_BACKEND_ORIGIN`                                      | `http://localhost:8080` | Адреса бекенду: ціль проксі та адреса старту входу через Google                                   |
| `VITE_PRICE_INTERNET` / `VITE_PRICE_INTERNET_TV`           | `250` / `350`           | Ціни тарифів (грн/міс). Бекенд не віддає їх по API — значення мають збігатися з цінами на бекенді |
| `VITE_EMAILJS_SERVICE_ID` / `_TEMPLATE_ID` / `_PUBLIC_KEY` | —                       | EmailJS для реальних листів відновлення пароля. Без них — фолбек у консоль                        |
| `VITE_PRIVATBANK_API_BASE_URL` / `_MERCHANT_ID`            | —                       | PrivatBank Acquiring. Без них — `MockPaymentGateway`                                              |

## Робота з бекендом

З `VITE_BACKEND_MODE=true` фронтенд працює з бекендом замість Mock-шару.

**1. Бекенд.** Запустіть бекенд (`./mvnw spring-boot:run`, PostgreSQL піднімається з
`compose.yaml`). Важливо для входу через Google:

- `FRONTEND_URL=http://localhost:5173/Super-Internet` — **з префіксом `/Super-Internet`**:
  бекенд повертає браузер на `FRONTEND_URL + /oauth-callback`;
- у Google Cloud Console дозволений redirect URI `http://localhost:8080/login/oauth2/code/google`.

**2. Фронтенд.** `cp .env.example .env` (там `VITE_BACKEND_MODE=true`), `npm install`,
`npm run dev`, відкрити `http://localhost:5173/Super-Internet/`.

**Як це влаштовано**

- Запити йдуть на `/api/...` і проксіюються Vite на `VITE_BACKEND_ORIGIN`. Якщо бекенд не
  запущений, проксі відповідає `502` — застосунок показує зрозуміле повідомлення про це.
- Авторизація — Bearer-JWT: `POST /auth/login|register` повертає `{ token, user }`, токен
  лежить у `localStorage` й додається в `Authorization`; `GET /auth/me` відновлює сесію;
  виходу на сервері немає (токен просто забувається). При `401` застосунок повертає на вхід.
- Вхід через Google: кнопка робить перехід на `<бекенд>/oauth2/authorization/google`; бекенд
  повертає на `/oauth-callback#token=…` ([OAuthCallbackPage](./src/pages/OAuthCallbackPage.tsx)),
  яка забирає токен із фрагмента, прибирає його з адресного рядка й веде в кабінет. Помилка
  Google → `/login?error=google` → форма входу з повідомленням. У dev-режимі Vite сам
  перенаправляє `/oauth-callback` і `/login` під `/Super-Internet`, якщо в `FRONTEND_URL`
  префікс забули.
- Дані клієнта складаються з кількох ендпоінтів (`/auth/me`, `/contracts/me`, `/chat/messages`);
  для підтримки й адміна — з `/users`, `/contracts`, `/chat/conversations`. Стан оновлюється
  опитуванням раз на 5 с (баланс, схвалення, нові повідомлення).
- У режимі бекенду немає автовідповіді в чаті; платежі проводить бекенд (свій шлюз).

## Скрипти

| Команда                 | Що робить                                        |
| ----------------------- | ------------------------------------------------ |
| `npm run dev`           | Дев-сервер з hot reload                          |
| `npm run build`         | Продакшн-збірка в `dist/`                        |
| `npm run preview`       | Локальний перегляд збірки                        |
| `npm run lint`          | ESLint                                           |
| `npm run type-check`    | `tsc --noEmit` (strict)                          |
| `npm run format`        | Prettier — відформатувати всі файли (з табами)   |
| `npm run format:check`  | Prettier — перевірити без змін                   |
| `npm run test`          | Vitest, один прогін                              |
| `npm run test:watch`    | Vitest у watch-режимі                            |
| `npm run test:coverage` | Покриття тестами                                 |
| `npm run deploy`        | Збірка + публікація на GitHub Pages (`gh-pages`) |

## Тестування

**112 тестів** (Vitest + Testing Library), зосереджені на бізнес-логічному шарі й
критичних UI-регресіях:

- Сервісний шар: auth-стратегії, відновлення пароля з лок-аутом, платіжний шлюз,
  санітизація, Zod-схеми, хешування паролів, rate-limiter
- Інтеграція з бекендом (HTTP підмінюється на рівні axios-адаптера): Bearer-авторизація,
  форми запитів до всіх ендпоінтів, мапінг DTO та помилок, склеювання списків для персоналу,
  відновлення пароля, колбек Google та кнопка входу
- Компонентні регресії: наприклад `Header.test.tsx` — перемикання мови в лендинг-шапці
  реально змінює текст (і перемикається назад), а сам перемикач не сидить усередині
  ряду навігації — саме ця пара речей одного разу ламалась, тест написаний, щоб це не
  повторилось мовчки

```bash
npm run test
npm run test:coverage
```

UI-шар поза цими сценаріями (окремі форми, панелі адмінки) покритий тестами частково —
свідомий компроміс.

## Документація API

`public/api/openapi.yaml` — специфікація OpenAPI 3.0, написана на ранньому етапі як чернетка
контракту (cookie-сесія). **Вона застаріла:** бекенд використовує Bearer-JWT, а його
актуальний контракт — у Swagger бекенду (`SWAGGER_ENABLED=true`, `/swagger-ui.html`).
Файл лишено як історичну довідку.

Файли лежать у `public/api/` (не в окремій папці `docs/`), тому Vite копіює їх у збірку
як є, і після `npm run deploy` вони автоматично публікуються на GitHub Pages разом з
рештою застосунку — за адресою:

**🔗 [https://vscrm.github.io/Super-Internet/api](https://vscrm.github.io/Super-Internet/api)**

Переглянути локально (під час розробки):

```bash
npm run dev
```

і відкрити `http://localhost:5173/Super-Internet/api/` (порт може відрізнятись —
дивіться, що виведе Vite в консоль). Просто відкрити `public/api/index.html`
подвійним кліком не спрацює в деяких браузерах через CORS-обмеження на `fetch()`
локального файлу — потрібен сервер (звідси й `npm run dev`, а не файл напряму).

## Деплой

Проєкт налаштований на GitHub Pages "з коробки" (`vite.config.ts` → `base:
"/Super-Internet/"`, скрипт `deploy` у `package.json`):

```bash
npm run deploy
```

## Структура проєкту

Повне дерево файлів проєкту, як є (без `node_modules`/`dist`/`.git` і без `.env`, який
існує лише локально й ніколи не потрапляє в репозиторій — див. `.gitignore`):

```
super-internet/
├── public/
│   ├── api/
│   │   ├── index.html
│   │   └── openapi.yaml
│   └── Logo.png
├── src/
│   ├── __tests__/
│   │   ├── components/
│   │   │   ├── GoogleSignInButton.test.tsx
│   │   │   ├── Header.test.tsx
│   │   │   └── atoms.test.tsx
│   │   ├── api/
│   │   │   ├── apiAuth.test.ts
│   │   │   ├── apiPasswordRecovery.test.ts
│   │   │   ├── backendApi.test.ts
│   │   │   ├── httpStub.ts
│   │   │   ├── mappers.test.ts
│   │   │   └── staffView.test.ts
│   │   ├── context/
│   │   │   └── capabilities.test.ts
│   │   ├── hooks/
│   │   │   └── useZodForm.test.tsx
│   │   ├── pages/
│   │   │   └── OAuthCallbackPage.test.tsx
│   │   ├── schemas/
│   │   │   ├── addStaff.test.ts
│   │   │   ├── auth.schema.test.ts
│   │   │   └── profile.schema.test.ts
│   │   ├── services/
│   │   │   ├── LocalAuthStrategy.test.ts
│   │   │   ├── LocalUserRepository.test.ts
│   │   │   ├── MockPaymentGateway.test.ts
│   │   │   ├── PasswordRecoveryService.test.ts
│   │   │   └── chatMessagePersistence.test.ts
│   │   └── shared/
│   │       ├── passwordHasher.test.ts
│   │       ├── rateLimiter.test.ts
│   │       ├── result.test.ts
│   │       └── sanitize.test.ts
│   ├── assets/
│   │   ├── fonts/
│   │   │   ├── Jura-VariableFont_wght.ttf
│   │   │   └── Tektur-VariableFont_wdth,wght.ttf
│   │   └── img/
│   │       ├── layers/
│   │       │   ├── Earth-Back.webp
│   │       │   ├── Earth-Front.webp
│   │       │   ├── Earth-on-WEB-Back.webp
│   │       │   ├── Earth-on-WEB-Front.webp
│   │       │   ├── Satellite-Back.webp
│   │       │   ├── Satellite-Front.webp
│   │       │   ├── Space-Back.webp
│   │       │   └── Space-Front.webp
│   │       └── Space.webp
│   ├── components/
│   │   ├── ErrorBoundary/
│   │   │   ├── ErrorBoundary.module.scss
│   │   │   └── ErrorBoundary.tsx
│   │   ├── PersonalAccount/
│   │   │   ├── AddStaffForm.tsx
│   │   │   ├── AdminDashboard.module.scss
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── ChatOverlayHeader.tsx
│   │   │   ├── ChatThread.module.scss
│   │   │   ├── ChatThread.tsx
│   │   │   ├── ClientCard.tsx
│   │   │   ├── ClientContractTab.tsx
│   │   │   ├── ClientDashboard.module.scss
│   │   │   ├── ClientDashboard.tsx
│   │   │   ├── ClientProfileModal.module.scss
│   │   │   ├── ClientProfileModal.tsx
│   │   │   ├── ClientStatusTab.tsx
│   │   │   ├── ClientSupportTab.tsx
│   │   │   ├── ClientsPanel.tsx
│   │   │   ├── DashboardHeader.module.scss
│   │   │   ├── DashboardHeader.tsx
│   │   │   ├── EquipmentItemCard.tsx
│   │   │   ├── EquipmentPanel.tsx
│   │   │   ├── ProfileContractEditForm.tsx
│   │   │   ├── ProfileStatusTab.tsx
│   │   │   ├── StaffPanel.tsx
│   │   │   ├── SupportChatOverlay.module.scss
│   │   │   ├── SupportChatOverlay.tsx
│   │   │   ├── SupportDashboard.module.scss
│   │   │   ├── SupportDashboard.tsx
│   │   │   ├── TicketCard.tsx
│   │   │   ├── dashboardShared.module.scss
│   │   │   ├── useAccountDeletionAction.ts
│   │   │   ├── useContractManagementActions.ts
│   │   │   ├── usePaymentAction.ts
│   │   │   ├── useServiceSelectionAction.ts
│   │   │   └── useSupportChatAction.ts
│   │   ├── atoms/
│   │   │   ├── Badge/
│   │   │   │   ├── Badge.module.scss
│   │   │   │   └── Badge.tsx
│   │   │   ├── Button/
│   │   │   │   ├── Button.module.scss
│   │   │   │   └── Button.tsx
│   │   │   ├── Input/
│   │   │   │   ├── Input.module.scss
│   │   │   │   └── Input.tsx
│   │   │   └── ToggleSwitch/
│   │   │       ├── ToggleSwitch.module.scss
│   │   │       └── ToggleSwitch.tsx
│   │   ├── molecules/
│   │   │   ├── GoogleSignInButton/
│   │   │   │   ├── GoogleSignInButton.module.scss
│   │   │   │   └── GoogleSignInButton.tsx
│   │   │   ├── AddressField/
│   │   │   │   ├── AddressField.module.scss
│   │   │   │   ├── AddressField.tsx
│   │   │   │   └── addressRequirements.ts
│   │   │   ├── ChatInput/
│   │   │   │   ├── ChatInput.module.scss
│   │   │   │   └── ChatInput.tsx
│   │   │   ├── EmailField/
│   │   │   │   ├── EmailField.module.scss
│   │   │   │   └── EmailField.tsx
│   │   │   ├── FormField/
│   │   │   │   ├── FormField.module.scss
│   │   │   │   └── FormField.tsx
│   │   │   ├── LanguageSwitcher/
│   │   │   │   ├── LanguageSwitcher.module.scss
│   │   │   │   └── LanguageSwitcher.tsx
│   │   │   ├── NavTabs/
│   │   │   │   └── NavTabs.tsx
│   │   │   ├── Pagination/
│   │   │   │   ├── Pagination.module.scss
│   │   │   │   └── Pagination.tsx
│   │   │   ├── PasswordField/
│   │   │   │   ├── PasswordField.module.scss
│   │   │   │   └── PasswordField.tsx
│   │   │   └── ServiceStatusBadge/
│   │   │       └── ServiceStatusBadge.tsx
│   │   ├── organisms/
│   │   │   ├── AuthScreen/
│   │   │   │   ├── AuthScreen.module.scss
│   │   │   │   └── AuthScreen.tsx
│   │   │   ├── PasswordRecoveryPanel/
│   │   │   │   ├── PasswordRecoveryPanel.module.scss
│   │   │   │   └── PasswordRecoveryPanel.tsx
│   │   │   └── ProfileEditForm/
│   │   │       └── ProfileEditForm.tsx
│   │   ├── Header.tsx
│   │   ├── HeaderContent.tsx
│   │   ├── LetterTitle.tsx
│   │   └── SliderLayer.tsx
│   ├── context/
│   │   ├── AppContext.tsx
│   │   ├── BackendAppProvider.tsx
│   │   ├── LocalAppProvider.tsx
│   │   ├── appContextCore.ts
│   │   ├── ModalContext.module.scss
│   │   ├── ModalContext.tsx
│   │   ├── contractFactory.ts
│   │   ├── staffAccountSeeding.ts
│   │   ├── useAuthActions.ts
│   │   ├── useChatActions.ts
│   │   ├── useClientMutation.ts
│   │   ├── useContractActions.ts
│   │   ├── useMonthlyBilling.ts
│   │   ├── usePaymentActions.ts
│   │   ├── useProfileActions.ts
│   │   ├── useSessionBootstrap.ts
│   │   └── useUserActions.ts
│   ├── hooks/
│   │   ├── useConfirmedAction.ts
│   │   ├── useDialogA11y.ts
│   │   ├── usePagination.ts
│   │   ├── useVerticalSlider.ts
│   │   └── useZodForm.ts
│   ├── i18n/
│   │   ├── locales/
│   │   │   ├── en.json
│   │   │   └── uk.json
│   │   └── index.ts
│   ├── pages/
│   │   ├── MainPage.tsx
│   │   ├── OAuthCallbackPage.tsx
│   │   └── PersonalAccountPage.tsx
│   ├── services/
│   │   ├── api/
│   │   │   ├── apiClient.ts
│   │   │   ├── backendApi.ts
│   │   │   ├── backendSession.ts
│   │   │   ├── dto.ts
│   │   │   ├── mappers.ts
│   │   │   ├── staffView.ts
│   │   │   └── tokenStore.ts
│   │   ├── auth/
│   │   │   ├── ApiAuthStrategy.ts
│   │   │   ├── ApiPasswordRecoveryService.ts
│   │   │   ├── AuthStrategy.ts
│   │   │   ├── LocalAuthStrategy.ts
│   │   │   ├── PasswordRecoveryService.ts
│   │   │   ├── authStrategyFactory.ts
│   │   │   ├── mockSessionCookie.ts
│   │   │   └── passwordRecoveryServiceFactory.ts
│   │   ├── email/
│   │   │   ├── ConsoleEmailService.ts
│   │   │   ├── EmailJsService.ts
│   │   │   ├── EmailService.ts
│   │   │   └── emailServiceFactory.ts
│   │   ├── payments/
│   │   │   ├── MockPaymentGateway.ts
│   │   │   ├── PaymentGateway.ts
│   │   │   ├── PrivatBankPaymentGateway.ts
│   │   │   └── paymentGatewayFactory.ts
│   │   └── repositories/
│   │       ├── LocalUserRepository.ts
│   │       ├── UserRepository.ts
│   │       └── userRepositoryFactory.ts
│   ├── shared/
│   │   ├── config/
│   │   │   └── env.ts
│   │   ├── lib/
│   │   │   ├── id.ts
│   │   │   ├── passwordHasher.ts
│   │   │   ├── rateLimiter.ts
│   │   │   ├── result.ts
│   │   │   ├── sanitize.ts
│   │   │   └── typed-storage.ts
│   │   └── schemas/
│   │       ├── auth.schema.ts
│   │       ├── payment.schema.ts
│   │       └── profile.schema.ts
│   ├── styles/
│   │   ├── PersonalAccountPage.module.scss
│   │   ├── global.css
│   │   └── main.css
│   ├── types/
│   │   └── models.ts
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── .env.example
├── .gitignore
├── .prettierrc.json
├── eslint.config.js
├── index.html
├── LICENSE
├── package-lock.json
├── package.json
├── README.md
├── setupTests.ts
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## Безпека

- Паролі: PBKDF2-SHA256, 100 000 ітерацій, унікальна сіль на користувача,
  timing-safe порівняння при перевірці
- Сесія (режим бекенду): Bearer-JWT у `localStorage` — бекенд не ставить cookie. Це означає,
  що XSS міг би його прочитати, тому всі текстові поля санітизуються, а токен живе лише
  годину (без refresh). Токен із Google-входу приходить у фрагменті URL (`#token=`), тож не
  потрапляє в логи серверів, і одразу прибирається з адресного рядка й історії
- CSRF: не потрібен — авторизація через заголовок `Authorization`, а не cookie
- Брутфорс: лок-аут на 60с після 5 невдалих спроб входу чи введення коду відновлення
  (client-side speed bump для Mock-режиму; **бекенд має форсувати це незалежно**)
- Санітизація всіх текстових полів (`shared/lib/sanitize.ts`) перед збереженням
- `npm audit`: 0 відомих вразливостей на момент останньої перевірки

## Продуктивність

- Code-splitting по маршрутах (`React.lazy` для `MainPage`/`PersonalAccountPage`)
- Усі фонові зображення — WebP, стиснені під реальний розмір показу (було ~61 МБ
  необроблених PNG/JPG, стало ~800 КБ)
- Пагінація для списків клієнтів і обладнання в адмінці
- Мемоізація (`useMemo`/`useCallback`/`React.memo`) у гарячих шляхах рендеру (слайдер
  на лендингу, важкі списки)

## Автор

Кручкевич Богдан Вікторович: [https://github.com/VSCRM](https://github.com/VSCRM)

## Ліцензія

[MIT](./LICENSE) — робіть з кодом що завгодно, атрибуція вітається, гарантій немає.
