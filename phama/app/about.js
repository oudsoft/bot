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
	var shopid = req.cookies.phamaconst.shopid;
    res.status(200).render('layout/liff/about.ejs', {
		title: appConst.appTitle, appname: appConst.appName, shopid: shopid
	});
});


/* Internal Method */



//* Export App Module */

module.exports = app;