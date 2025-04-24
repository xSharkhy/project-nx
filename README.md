# project-nx

**Nintendo Switch Prize Tracker & Telegram Bot Backend**

A modular Node.js & Express service that:
- Scrapes Nintendo Switch product pages on Amazon France (via Playwright or HTTP fetch).  
- Sends real-time availability and price updates through a Telegram bot.  
- Allows on-demand screenshots and data fetching via REST endpoints.  

---

## 🚀 Features

- **Playwright-powered scraper** for product page screenshots  
- **Fetch-based extractor** for quick HTML/JSON retrieval  
- **Amazon France NSW2 availability check** with optional screenshot  
- **Telegram integration** using [grammy](https://github.com/grammyjs/grammY)  
- **Structured logging** with level/module/date filtering  

---

## 🛠️ Tech Stack

- **Node.js** v22.14.0
- **Express** v5.1.0
- **grammy** v1.35.1
- **Playwright** v1.51.1

---

## 📦 Installation

```bash
git clone https://github.com/xSharkhy/project-nx.git
cd project-nx
npm install
```

Ensure you’re running Node.js v22.14.0 (as specified in `.node-version`)

---

## 🔧 Environment Variables

Create a `.env` in the root:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
PORT=3000
```

---

## 🚗 Usage

```bash
npm start
```

- Server listens on `http://localhost:${PORT}` (default 3000).  
- Upon startup, the Telegram bot is initialized automatically

---

## 📑 API Endpoints

### Base

- `GET /`  
  - Returns `{ message: "Hello World!" }`

### Extractor (scraping & fetching)

- `GET /extractor/get-by-request?url=<PAGE_URL>`  
  Fetches raw HTML or JSON via HTTP.
- `GET /extractor/get-by-scraper?url=<PAGE_URL>`  
  Navigates with Playwright & returns a screenshot.
- `GET /extractor/nsw2-amznfr-availability?url=<OPTIONAL_AMZN_URL>`  
  Checks Nintendo Switch OLED availability on Amazon France; takes a screenshot if available.

### Telegram

- `GET /telegram/send-message?chatId=<ID>&message=<TEXT>`  
  Sends a custom message via the bot.
- `GET /telegram/test?chatId=<ID>`  
  Sends a test notification.

### Logs

- `GET /logs?chatId=<ID>[&level=&module=&date=&lines=]`  
  Retrieves application logs with optional filtering; requires Telegram chat ID for authorization.

---

## 📂 Project Structure

```
project-nx/
├─ .env                   # Environment variables
├─ .node-version          # Node.js version (v22.14.0)
├─ Dockerfile
├─ package.json
├─ src/
│  ├─ server.js           # App entrypoint & bot init
│  ├─ modules/
│  │  ├─ extractor/       # Scraper & HTTP fetch logic
│  │  ├─ telegram/        # Telegram bot commands & routes
│  │  └─ logs/            # Logging endpoints & controllers
│  └─ utils/              # Shared utilities (console logging, error handling)
└─ README.md
```

---

## ⚖️ License

[ISC](https://opensource.org/licenses/ISC)

---

## 🙌 Contributing

Contributions, issues, and feature requests are welcome! Please fork the repo and submit a pull request.