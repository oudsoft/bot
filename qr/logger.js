//logger.js
const winston = require('winston');
require('winston-daily-rotate-file');

const logger =  (module) => {
	const transport = new winston.transports.DailyRotateFile({
		filename: './logs/log-%DATE%.txt',
		datePattern: 'YYYY-MM-DD',
		prepend: true,
		/* level: process.env.ENV === 'development' ? 'silly' : 'error', */
		level: 'silly'
	});
	const logger = winston.createLogger({
		transports: [transport],
	});
	return logger;
}  

module.exports = logger;