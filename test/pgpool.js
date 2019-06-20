//pgpool.js

var pg = require('pg');
var pool;
var winpool;

var config = {
	host: '202.28.68.11',
	user: 'sasurean',
	database: 'phamadb', 
	password: 'drinking', 
	port: 1486, 
	max: 10, // max number of connection can be open to database
	idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
};

var windbconfig = {
	host: '202.28.68.11',
	user: 'sasurean',
	database: 'windb', 
	password: 'drinking', 
	port: 1486, 
	max: 10, // max number of connection can be open to database
	idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
};

module.exports = {
    getPool: function () {
      if (pool) return pool; // if it is already there, grab it here
      pool = new pg.Pool(config);
      return pool;
	},
    getWinPool: function () {
      if (winpool) return winpool; // if it is already there, grab it here
      winpool = new pg.Pool(windbconfig);
      return winpool;
	}
}