//orders.js
const colors = require('colors/safe');
const util = require("util");
const fs = require('fs');
const url = require('url'); 
const path = require("path");
const parentDir = path.normalize(__dirname+"/..");

const logger = require('../lib/logger');
const express = require('express');
const multer = require('multer');
const app = express();
const upload = multer({ dest: parentDir + '/res/img/upload' });

const myConfig = require("../lib/const/config.js");
const appConst = myConfig.appConst;


 /**
 * setting up pool of postgresql connection
 */ 
const db = require('../lib/pgpool.js');
const pool = db.getPool();

 /**
 * Start http's methods support
 */ 

app.get('/', function(req, res) {
	//console.log(colors.blue('req.query.pageno check : ') + colors.yellow(JSON.stringify(req.query.pageno)));
	res.status(200).render('layout/liff/orders.ejs', {title: appConst.appTitle, appname: appConst.appName });
})

/* Internal Method */

function doLoadDinTableCodeno(dinid){
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "select codeno, name from dintable where id=$1";
			client.query(sqlCmd, [dinid]).then(res => {
				if (res.rowCount > 0){
					client.query('COMMIT');
					resolve(res.rows);
				} else {
					resolve({});
				}
			}).catch(err => {
				client.query('ROLLBACK');
				logger().error(new Date()  + " >> index.js Error Stack @doLoadDinTableCodeno >> " + err.stack);
				reject(err.stack)
			});
			client.release();
		});
	});
}

//* Export App Module */

module.exports = app;