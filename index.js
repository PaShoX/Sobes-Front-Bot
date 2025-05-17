require("dotenv").config();
const {
	Bot,
	Keyboard,
	GrammyError,
	HttpError,
	InlineKeyboard,
} = require("grammy");
const { getRandomQuestion, getCorrectAnswer } = require("./utils");

const bot = new Bot(process.env.BOT_API_KEY);

bot.command("start", async (ctx) => {
	const startKeyBoard = new Keyboard()
		.text("HTML")
		.text("CSS")
		.row()
		.text("JavaScript")
		.text("React")
		.row()
		.text("Случайный вопрос")
		.resized();
	await ctx.reply(
		"Привет! Я - Sobes Front Bot 🤖 \nЯ помогу тебе подготовиться к собеседованию по фронтенду"
	);
	await ctx.reply("Давай начнём.😉Выбери тему вопроса? ⬇️", {
		reply_markup: startKeyBoard,
	});
});

bot.hears(
	["HTML", "CSS", "JavaScript", "React", "Случайный вопрос"],
	async (ctx) => {
		const topic = ctx.message.text.toLowerCase();
		const { question, questionTopic } = getRandomQuestion(topic);

		let inLineKeyboard;

		if (question.hasOptions) {
			const buttonRows = question.options.map((option) => {
				return [
					InlineKeyboard.text(
						option.text,
						JSON.stringify({
							type: `${questionTopic}-option`,
							isCorrect: option.isCorrect,
							questionId: question.id,
						})
					),
				];
			});

			inLineKeyboard = InlineKeyboard.from(buttonRows);
		} else {
			inLineKeyboard = new InlineKeyboard().text(
				"Узнать ответ",
				JSON.stringify({
					type: questionTopic,
					questionId: question.id,
				})
			);
		}

		await ctx.reply(question.text, {
			reply_markup: inLineKeyboard,
		});
	}
);

bot.on("callback_query:data", async (ctx) => {
	const callbackData = JSON.parse(ctx.callbackQuery.data);

	if (!callbackData.type.includes("option")) {
		const answer = getCorrectAnswer(callbackData.type, callbackData.questionId);
		await ctx.reply(answer, {
			parse_mode: "HTML",
			disable_web_page_preview: true,
		});
		await ctx.answerCallbackQuery();
		return;
	}

	if (callbackData.isCorrect) {
		await ctx.reply("Верно 👌🏼");
		await ctx.answerCallbackQuery();
		return;
	}

	const answer = getCorrectAnswer(
		callbackData.type.split("-")[0],
		callbackData.questionId
	);
	await ctx.reply(`Неверно 🙅🏻‍♂️ Правильный ответ: ${answer}`);
	await ctx.answerCallbackQuery();
});

bot.catch((err) => {
	const ctx = err.ctx;
	console.error(`Error while handling update ${ctx.update.update_id}:`);
	const e = err.error;
	if (e instanceof GrammyError) {
		console.error("Error in request:", e.description);
	} else if (e instanceof HttpError) {
		console.error("Could not contact Telegram:", e);
	} else {
		console.error("Unknown error:", e);
	}
});

bot.start();
