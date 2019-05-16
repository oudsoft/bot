//index.js
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
	res.clearCookie(appConst.cookieName);
	res.cookie(appConst.cookieName, appConst);
	console.log(colors.green('check cookie : ') + colors.yellow(JSON.stringify(req.cookies)));
	console.log(colors.green('phamaconst cookie check : ') + colors.yellow(JSON.stringify(req.cookies.phamaconst)));
    //render to views/index.ejs template file
    res.status(200).render('layout/liff/index.ejs', {
		title: appConst.appTitle, appname: appConst.appName
	});
})

 app.get('/userrole/(:lpsid)', function(req, res) {
	doLoadUserRole(req.params.lpsid).then(function(rows) {
		var lastRole = rows[rows.length-1];
		var lastRow = [lastRole];
		console.log(colors.green('userrole row : ') + colors.green(JSON.stringify(rows))); 
		res.clearCookie(appConst.cookieName);
		res.cookie(appConst.cookieName, lastRow);
		res.status(200).send(lastRow);
    });
})

/* Internal Method */

function doLoadUserRole(lpsid){
   	//console.log(colors.green('lpsid : ') + colors.green(JSON.stringify(lpsid)));
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			//select u.id, u.lpsid, role.type, role.shopid, role.fname, role.lname, shop.name, shop.tel, shop.address, shop.slogan, lineconfig.laccid from "user" u, role, shop, lineconfig where (role.userid=u.id) and (role.shopid=shop.id) and (lineconfig.shopid=shop.id) and (u.lpsid = 'U2ffb97f320994da8fb3593cd506f9c43')
			var sqlCmd = "select u.id, u.lpsid, role.type, role.shopid, role.fname, role.lname, shop.name, shop.tel, shop.address, shop.slogan, lineconfig.laccid from \"user\" u, role, shop, lineconfig where (role.userid=u.id) and (role.shopid=shop.id) and (lineconfig.shopid=shop.id) and (u.lpsid = '"+ lpsid + "')";
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