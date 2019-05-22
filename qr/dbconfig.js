const config = {
		host: '202.28.68.11',
		user: 'sasurean',
		database: 'botdb', 
		password: 'drinking', 
		port: 1486, 
		max: 10, // max number of connection can be open to database
		idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
};
module.exports = config;