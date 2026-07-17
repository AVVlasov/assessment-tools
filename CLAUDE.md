# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Набор инструментов для оценки стартап команд и их проектов, оценка выступлений участников

## 🛠️ Tech Stack
- **TypeScript / React**
- **Redux Toolkit / RTK Query** — state и data слой
- **@chakra-ui/react** — UI-фреймворк
- **Lottie** — анимация интерфейса
- **brojs/cli** — управление сборкой, dev-server, генерацией, тестами и scaffold-командами
- **REST API** — интеграция с backend, Express/NodeJS моки
- **i18next** — интернационализация (ru/en)
- **ESLint, Prettier, Stylelint** — автоматизация чистоты кода
- **Jenkins** — автоматизация тестирования и деплоя
- **Webpack** — сборка фронтенда
- **Docker, MongoDB** — База данных

## запуск проекта 
npm start



# Инструкции по работе с проектом
- после запуска проект будет расположен по адресу http://localhost:8099/assessment-tools

- все API работает и проксируется по адресу http://localhost:8099/api

тестовый пользователь: 
login: 'admin',
password: 'SecurePass123!'

- если его нет завести его можно скриптом recreate-test-user.js

- не редактируй файлы проекта в терминале powershell или в любом другом терминале, не надо перезагружать сервер, там есть hot reload

- нельзя трогать в bro.config.js 'assessment-tools.api': '/api'

- не используй в js и typescript стиль кода от языка Python
- используй mcp context7 для получения code convention и code style проекта согласно тех стеку

- не останавливайся если есть ошибки на ui
- проверяй что все ключи локализации имеют текстовки
- проверяй что все api выдают статус 200
- не заканчивай работу если есть любые ошибки, строй план выполнения задач 
- все api должны данные хранить в базе данных, никаких моков и глобальных переменных, текущая база данных mongoDB которая поднята в doker
- на изменение автотестов на работающий функционал запрашивай подтверждение от пользователя
- не создавай инструкции, summary, report
- не создавай документацию о внесенных изменениях
- не делай финальные итоговые документы
- не делай файлы с примерами
- запрещено создавать файлы типа: *REPORT*, *SUMMARY*, *DOCS*, *CHECKLIST*, *EXAMPLES*, *README* и подобные
- **НЕ создавай никакие файлы в корне проекта**

- используй в качестве документации по написанию тестов @https://testing-library.com/ 

- при проверке или доработке API используй mcp MongoDB

- Node.js не кэширует старые модули, на нем стоит хот релоад папки api

- не создавай документацию о внесенных изменениях
- не используй автотесты для поиска проблем, используй браузер, если инструмент браузер не доступен остановись и попроси пользователя включить этот инструмент

### ⚠️ ВАЖНО: Работа с API путями
- **НИКОГДА не хардкодь `/api`** в коде!
- Всегда используй `URLs.apiBase` из `src/__data__/urls.ts`
- В API файлах импортируй: `import { URLs } from '../urls'`
- В createApi используй: `baseQuery: fetchBaseQuery({ baseUrl: URLs.apiBase })`
- Значение берется из `bro.config.js` ключ `'assessment-tools.api': '/api'`
- Это позволяет легко менять базовый путь API без правки кода

### Правила контрастности и читаемости
- **НЕ допускай светлых шрифтов на светлом фоне или темных на темном**
- **Всегда следи за высокой контрастностью шрифтов и иконок**
- На темном фоне (#0A0A0A, #1A1A1A, #2A2A2A):
  - Используй белый текст (#FFFFFF, white)
  - Для второстепенного текста: #E0E0E0, #D0D0D0, #B0B0B0 (не темнее!)
  - Для акцентов: #D4FF00 (лайм), #FF4444 (красный для ошибок/удаления)
  - Иконки должны быть яркими: white, #D4FF00, #FF4444, #4CAF50
- На светлом фоне:
  - Используй темный текст (#0A0A0A, #1A1A1A)
  - Для второстепенного текста: #666666, #555555 (не светлее!)
- Проверяй контрастность всех интерактивных элементов:
  - Кнопки должны быть четко видны
  - Иконки (редактирования, удаления, действий) должны иметь яркие цвета
  - При hover состояниях контрастность должна усиливаться
- Избегай серых иконок (#666666 и темнее) на темном фоне
- Для критичных действий (удаление) используй красный (#FF4444) на темном фоне

## 📂 Project Structure
@types/ # Глобальные типы
locales/ # Локализация (i18next: ru/en)
remote-assets/ # Внешние ресурсы (images, icons)
e2e/ # Playwright E2E тесты
ai/ # Контексты для разработки
src/
├── __data__/ # Data слой: API, store, константы, RTK Query
│ ├── api/ # API-клиенты для всех модулей
│ │ ├── authApi.ts # Аутентификация
│ │ └── __tests__/ # Тесты API
│ ├── store.ts # Redux store конфигурация
│ ├── urls.ts # URL endpoints
│ └── __tests__/ # Тесты data слоя
├── components/ # Кастомные UI-компоненты
│ ├── animations/ # Лоттие анимации
│ ├── dashboard/ # Компоненты дашборда
│ ├── forms/ # Формы (Input, Select, Checkbox, Textarea)
│ ├── layout/ # Макет приложения
│ ├── skeletons/ # Скелеты загрузки
│ ├── ui/ # Чакра UI компоненты
│ ├── ErrorBoundary.tsx # Обработка ошибок
│ ├── ProtectedRoute.tsx # Защита маршрутов
│ ├── __tests__/ # Тесты компонентов
│ └── index.ts # Экспорт
├── pages/ # Страницы (соответствуют маршрутам)
│ ├── auth/ # Аутентификация (login, register, forgot-password)
│ ├── dashboard/ # Главная страница
│ ├── settings/ # Настройки
│ ├── __tests__/ # Тесты страниц
│ └── index.ts # Экспорт
├── hooks/ # Custom React hooks
│ ├── useAuth.ts # Авторизация
│ ├── useDebounce.ts # Debounce
│ ├── useToast.ts # Уведомления
│ └── __tests__/ # Тесты хуков
├── utils/ # Вспомогательные функции
│ ├── constants.ts # Константы
│ ├── formatters.ts # Форматирование данных
│ ├── storage.ts # LocalStorage утилиты
│ ├── jwt.ts # JWT обработка
│ ├── colorMode.ts # Режим темы
│ ├── fileManager.ts # Работа с файлами
│ ├── validators/ # Валидация форм
│ ├── __tests__/ # Тесты утилит
│ └── index.ts # Экспорт
├── types/ # Локальные типы и интерфейсы
│ └── (типы распределены по модулям)
├── app.tsx # Корневой компонент
├── index.tsx # Точка входа приложения
├── theme.tsx # Чакра UI тема
├── dashboard.tsx # Дашборд компонент
└── i18n.ts # i18next конфигурация

stubs/ # Backend моки (Express)
├── api/ # Express приложение
├── config/ # Конфиг БД
├── middleware/ # Middleware (auth)
├── models/ # MongoDB модели
├── routes/ # API маршруты
└── scripts/ # Утилиты

e2e/ # Playwright E2E тесты

@types/ # Глобальные типы TypeScript
bro.config.js # Конфиг build & routing
tsconfig.json # TS-конфиг
package.json # Зависимости
jest.config.js # Jest конфиг
playwright.config.ts # Playwright конфиг
eslint.config.mjs # Linting-правила
.prettierrc.json # Formatting-правила
Jenkinsfile / .github/ # CI/CD pipeline
README.md # Описание, инструкции
CLAUDE.md # Гайд для разработки


## 📝 Code Standards

### TypeScript
- Строгая типизация во всех слоях (tsconfig strict: true).
- Явная типизация возвращаемых значений.
- Классификация типов: @types/ для глобальных, src/types/ для модульных.
- Не использовать `any` без спец. причины и комментария.

### Redux + RTK Query
- Одна папка __data__/ для данных и Redux-слоев.
- API клиенты в `src/__data__/api/`, slices в `src/__data__/slices/`.
- Использовать tagTypes для кэширования, invalidate для мутаций.
- Все endpoints должны быть типизированы.
- **ВАЖНО**: Не хардкодить `/api`, использовать `URLs.apiBase` из `src/__data__/urls.ts`

### UI/Styling
- Chakra UI как основной компонентный фреймворк.
- Emotion — только для сложных кейсов/анимаций.
- Предпочитать theme-токены и responsive-массивы Chakra.

### Интернационализация
- Локализация хранится в `locales/`
- Подключение через @brojs/i18nextconfig и хуки i18next
- Все тексты и кнопки должны быть ключами перевода

### Соглашения
- components: максимум 200 строк, тесты рядом (Component.tsx, Component.test.tsx)
- pages: соответствуют маршрутам bro.config.js
- assets: только то, что реально нужно в UI/production

# Chakra UI v3 Rules
используй mcp chakra-ui
