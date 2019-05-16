//about.js
const colors = require('colors/safe');
const util = require("util");
const fs = require('fs');
const url = require('url'); 
const request = require('request-promise');
const express = require('express');
const app = express();

const myConfig = require("../lib/const/config.js");
const appConst = myConfig.appConst;

 /**
 * setting up pool of postgresql connection
 */ 
const db = require('../lib/pgpool.js');
const pool = db.getPool();

/* Start http protocal Interface section */
app.get('/', function(req, res) {
    res.status(200).render('layout/liff/about.ejs', {
		title: appConst.appTitle, appname: appConst.appName
	});
});

app.post('/ldisplaynamelist', function(req, res) {
	doLoadLdisplayName().then(function(rows) {
		res.status(200).send(rows);
    });
});

/* Internal Method */

function doLoadLdisplayName(){
   	//console.log(colors.green('lpsid : ') + colors.green(JSON.stringify(lpsid)));
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "select u.id, u.lpsid, u.ldisplayname from \"user\" u order by id";
			client.query(sqlCmd, []).then(res => {
				client.query('COMMIT');
				resolve(res.rows);
			}).catch(err => {
				client.query('ROLLBACK');
				reject(err.stack)
			});
			client.release();
		});
	});
}

//* Export App Module */

module.exports = app;