process.env.NTBA_FIX_319 = 1;

const TelegramBot = require("node-telegram-bot-api");
const secrets = require("./secrets.json");

const token = secrets.telegram.token;
const chatId = secrets.telegram.chatId;
const bot = new TelegramBot(token, { polling: true });

const sendMessage = (message) => {
  bot.sendMessage(chatId, message).catch((error) => {
    console.log(error);
  });
};

module.exports = { sendMessage };
