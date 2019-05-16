//phamagroup.js
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
	var shopid = req.cookies.phamaconst[0].shopid;
	doLoadGroupList(shopid).then(function(rows) {
		//console.log(colors.blue('GroupList Rows : ') + colors.yellow(JSON.stringify(rows)));
		res.status(200).render('layout/liff/phamagroup.ejs', {data : rows, title: appConst.appTitle, appname: appConst.appName, shopid: shopid });
	});
})

app.post('/upload/(:groupid)', upload.array('photos'), function(req, res, next) {
	var groupid = req.params.groupid;
	var shopid = req.cookies.phamaconst[0].shopid;

	var oldPath = req.files[0].destination + '/' + req.files[0].filename;
	var newPath = req.files[0].destination + '/'  + shopid + "/group/" + req.files[0].originalname;

	var readStream = fs.createReadStream(oldPath);
	var writeStream = fs.createWriteStream(newPath);

	readStream.pipe(writeStream);

	var filename = req.files[0].originalname;
	//console.log(colors.blue('groupid : ') + colors.yellow(JSON.stringify(groupid)));
	doUpdateGroupPicture(groupid, filename).then(function(sts) {
		//res.send(req.files);
		//console.log(colors.green('req.files : ') + colors.green(JSON.stringify(req.files)));
		/* [{"fieldname":"photos","originalname":"000M2S9CEC92F28209A20Cj.jpg","encoding":"7bit","mimetype":"image/jpeg","destination":"/home/sasurean/node/food/res/img/upload","filename":"8b7b0b44387626f6b066dcdacf6b06a3","path":"/home/sasurean/node/food/res/img/upload/8b7b0b44387626f6b066dcdacf6b06a3","size":75058}] */
		res.status(200).send({status: {code: 200, detail: "OK"}, filename: filename});
	});
});

app.post('/edit/(:id)', function(req, res, next) {
   	//console.log(colors.green('req body : ') + colors.green(JSON.stringify(req.body)));
	var id = req.params.id;
	var data = req.body;
	doUpdateGroup(id, data).then(function(sts) {
		res.status(200).send({status: {code: 200, detail: "OK"}});
	}).catch(function(error) {
		res.status(200).send({status: {code: 500, detail: "Not OK"}});
	});
})

app.post('/delete/(:id)', function(req, res, next) {
   	//console.log(colors.green('req body : ') + colors.green(JSON.stringify(req.body)));
	var id = req.params.id;
	doDeleteGroup(id).then(function(sts) {
		res.status(200).send({status: {code: 200, detail: "OK"}});
	}).catch(function(error) {
		res.status(200).send({status: {code: 500, detail: "Not OK"}});
	});
})

app.post('/add', function(req, res, next) {
   	//console.log(colors.green('req body : ') + colors.green(JSON.stringify(req.body)));
	var shopid = req.cookies.phamaconst[0].shopid;
	var data = req.body;
	doAddGroup(data, shopid).then(function(newid) {
		res.status(200).send({status: {code: 200, detail: "OK"}, newid: newid});
	}).catch(function(error) {
		res.status(200).send({status: {code: 500, detail: "Not OK"}});
	});
})

/* Internal Method*/

function doLoadGroupList(shopid){
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "select * from phamagroup where shopid =$1 order by id";
			client.query(sqlCmd, [shopid]).then(res => {
				if (res.rowCount > 0){
					client.query('COMMIT');
					resolve(res.rows);
				} else {
					resolve({});
				}
			}).catch(err => {
				client.query('ROLLBACK');
				reject(err.stack)
			});
			client.release();
		});
	});
}

function doUpdateGroup(id, data) {
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "update phamagroup set name=$1, description=$2, status=$3, gtype=$4 where id =$5";
			client.query(sqlCmd, [data.name, data.description, data.status, data.gtype, id]).then(res => {
				client.query('COMMIT');
				resolve({status: 200});
			}).catch(err => {
				client.query('ROLLBACK');
				reject(err.stack)
			});
			client.release();
		});
	});
}

function doUpdateGroupPicture(id, filename) {
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "update phamagroup set picture=$1 where id =$2";
			client.query(sqlCmd, [filename, id]).then(res => {
				client.query('COMMIT');
				resolve({status: 200});
			}).catch(err => {
				client.query('ROLLBACK');
				reject(err.stack)
			});
			client.release();
		});
	});
}

function doDeleteGroup(id){
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "delete from phamagroup where id =$1";
			client.query(sqlCmd, [id]).then(res => {
				client.query('COMMIT');
				resolve({status: 200});
			}).catch(err => {
				client.query('ROLLBACK');
				reject(err.stack)
			});
			client.release();
		});
	});
}

function doAddGroup(data, shopid){
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "insert into phamagroup (name, description, picture, shopid, status, gtype) values ($1, $2, $3, $4, $5, $6) RETURNING id";
			client.query(sqlCmd, [data.name, data.description,'', shopid, data.status, data.gtype]).then(res => {
				client.query('COMMIT');
				resolve(res.rows[0].id);
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