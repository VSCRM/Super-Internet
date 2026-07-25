# Super-Internet — Клієнтський портал

<p align="center">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript" />
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" />
  <img alt="Tests" src="https://img.shields.io/badge/tests-70%20passing-brightgreen" />
  <img alt="API docs" src="https://img.shields.io/badge/API%20docs-OpenAPI%203.0-85EA2D?logo=swagger&logoColor=black" />
  <a href="./LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-green" /></a>
</p>

Курсова робота (2 курс). Односторінковий React 19 + TypeScript застосунок для інтернет/ТБ-провайдера: маркетинговий лендинг і рольовий особистий кабінет (Клієнт / Підтримка / Адміністратор) з автентифікацією, білінгом, керуванням обладнанням та чатом підтримки.

**Примітка:** Це повна переробка під TypeScript + React. Якщо вам потрібна стара версія (HTML5 + CSS3 + Vanilla JS), дивіться у гілці [old-version](https://github.com/VSCRM/Super-Internet/tree/old-version).

**🔗 Демо:** [https://vscrm.github.io/Super-Internet/](https://vscrm.github.io/Super-Internet/)

**📦 Репозиторій:** [https://github.com/VSCRM/Super-Internet](https://github.com/VSCRM/Super-Internet)

**📘 API-документація (Swagger/OpenAPI):** [docs/openapi.yaml](./docs/openapi.yaml) — специфікація контракту бекенду, [docs/api.html](./docs/api.html) — інтерактивний Swagger UI перегляд (інструкція запуску нижче, у розділі [Документація API](#документація-api)).

---

## Зміст

- [Можливості](#можливості)
- [Технологічний стек](#технологічний-стек)
- [Архітектура](#архітектура)
- [Швидкий старт](#швидкий-старт)
- [Змінні середовища](#змінні-середовища)
- [Скрипти](#скрипти)
- [Тестування](#тестування)
- [Документація API](#документація-api)
- [Деплой](#деплой)
- [Структура проєкту](#структура-проєкту)
- [Безпека](#безпека)
- [Продуктивність](#продуктивність)
- [Відомі обмеження та подальші кроки](#відомі-обмеження-та-подальші-кроки)
- [Ліцензія](#ліцензія)

---

## Можливості

**Клієнт**

- Реєстрація/вхід з real-time Zod-валідацією (email, пароль, телефон)
- Вибір послуги (Інтернет / Інтернет + ТБ), договір з незмінним ID обладнання
- Оплата (mock-шлюз або PrivatBank-контракт), регулярні платежі
- Чат з підтримкою, відновлення пароля через email-код (EmailJS)

**Підтримка**

- Черга звернень, відсортована так, щоб непрочитане ніколи не губилось на іншій сторінці
- Перегляд і редагування профілю/договору клієнта (ID обладнання — тільки читання)

**Адміністратор**

- Керування персоналом підтримки
- Моніторинг і підтвердження підключення обладнання (з пагінацією)
- Список клієнтів (з пагінацією)

**Наскрізне**

- Захист від брутфорсу на вхід і код відновлення пароля (лок-аут після 5 спроб)
- ErrorBoundary — рендер-помилка не кладе весь застосунок білим екраном
- Доступні модалки: focus trap, Escape, `role="dialog"`/`aria-modal`
- CSRF-заготовка для майбутнього бекенду (double-submit cookie через axios)
- Дві мови (uk/en) з перемикачем в шапці — реально працює, включно з повідомленнями
  валідації форм, не лише зі статичним текстом

## Технологічний стек

|                      |                                           |
| -------------------- | ----------------------------------------- |
| **Мова**             | TypeScript (strict mode, без `any`)       |
| **UI**               | React 19, SASS Modules (BEM)              |
| **Валідація**        | Zod                                       |
| **Локалізація**      | i18next / react-i18next (uk, en)          |
| **Роутинг**          | React Router                              |
| **Збірка**           | Vite                                      |
| **Тести**            | Vitest + Testing Library                  |
| **Лінт**             | ESLint (typescript-eslint, react-hooks)   |
| **HTTP-клієнт**      | axios (для майбутнього реального бекенду) |
| **API-документація** | OpenAPI 3.0 (`docs/openapi.yaml`)         |

## Архітектура

### Патерни проєктування

- **Strategy** — `AuthStrategy` (`LocalAuthStrategy` для Mock-режиму, `ApiAuthStrategy` —
  готовий контракт для реального бекенду)
- **Repository** — `UserRepository` (`LocalUserRepository` / `ApiUserRepository`)
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

Застосунок відкриється на `http://localhost:5173/Super-Internet/`. Без жодних
додаткових налаштувань усе працює проти локального Mock-шару (localStorage) — реальний
бекенд не потрібен.

**Тестові акаунти** (створюються автоматично при першому запуску, лише в Mock-режимі):

| Роль          | Email             | Пароль     |
| ------------- | ----------------- | ---------- |
| Адміністратор | admin@super.net   | admin123   |
| Підтримка     | support@super.net | support123 |

## Змінні середовища

Повний список — у [.env.example](./.env.example). Коротко:

| Змінна                                                     | За замовчуванням | Призначення                                                                                |
| ---------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------ |
| `VITE_BACKEND_MODE`                                        | `false`          | `true` → реальний бекенд (`ApiAuthStrategy`/`ApiUserRepository`); `false` → локальний Mock |
| `VITE_API_BASE_URL`                                        | `/api`           | Базовий URL бекенду (лише при `VITE_BACKEND_MODE=true`)                                    |
| `VITE_EMAILJS_SERVICE_ID` / `_TEMPLATE_ID` / `_PUBLIC_KEY` | —                | EmailJS для реальних листів відновлення пароля. Без них — фолбек у консоль                 |
| `VITE_PRIVATBANK_API_BASE_URL` / `_MERCHANT_ID`            | —                | PrivatBank Acquiring. Без них — `MockPaymentGateway`                                       |

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

**70 тестів** (Vitest + Testing Library), зосереджені на бізнес-логічному шарі й
критичних UI-регресіях:

- Сервісний шар: auth-стратегії, відновлення пароля з лок-аутом, платіжний шлюз,
  санітизація, Zod-схеми, хешування паролів, rate-limiter
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

`docs/openapi.yaml` — специфікація OpenAPI 3.0 (валідована `openapi-spec-validator`),
що описує точний контракт бекенду, який очікує фронтенд у `VITE_BACKEND_MODE=true`
(зчитано напряму з коду `ApiAuthStrategy`/`UserRepository`, а не вигадано окремо).
Бекенд ще не реалізований — ця специфікація є контрактом для розробки бекенду, не
описом того, що вже працює.

Переглянути з UI:

```bash
npx serve docs
```

Потім відкрити `http://localhost:3000/api.html`. Просто відкрити `docs/api.html`
подвійним кліком не спрацює в деяких браузерах через CORS-обмеження на `fetch()`
локального файлу — потрібен статичний сервер.

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
├── docs/
│   ├── api.html
│   └── openapi.yaml
├── public/
│   └── Logo.png
├── src/
│   ├── __tests__/
│   │   ├── components/
│   │   │   ├── Header.test.tsx
│   │   │   └── atoms.test.tsx
│   │   ├── hooks/
│   │   │   └── useZodForm.test.tsx
│   │   ├── schemas/
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
│   │   └── PersonalAccountPage.tsx
│   ├── services/
│   │   ├── auth/
│   │   │   ├── ApiAuthStrategy.ts
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
- Сесія: HttpOnly-cookie (архітектура готова до JWT); токен ніколи не читається й не
  зберігається в JS-коді
- CSRF: double-submit cookie підключено на рівні axios (`ApiAuthStrategy`) — активується,
  щойно бекенд почне видавати `XSRF-TOKEN`
- Брутфорс: лок-аут на 60с після 5 невдалих спроб входу чи введення коду відновлення
  (client-side speed bump для Mock-режиму; **реальний бекенд має форсувати це незалежно**)
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
