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


//* Export App Module */

module.exports = app;