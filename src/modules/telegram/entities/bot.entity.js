import { Bot } from 'grammy'

class TelegramBot {
  static instance = null
  bot = null

  constructor () {
    if (TelegramBot.instance) {
      return TelegramBot.instance
    }

    TelegramBot.instance = this
  }

  initialize (token) {
    if (!this.bot && token) {
      this.bot = new Bot(token)
      return true
    }
    return false
  }

  getInstance () {
    return this.bot
  }

  isInitialized () {
    return this.bot !== null
  }
}

// Exportamos una única instancia de TelegramBot
export default new TelegramBot()
