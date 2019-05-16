//phamareview.js
const colors = require('colors/safe');
const util = require("util");
const fs = require('fs');
const url = require('url'); 
const path = require("path");
const parentDir = path.normalize(__dirname+"/..");

const request = require('request-promise');
const multer = require('multer');
const express = require('express');
const app = express();
const upload = multer({ dest: parentDir + '/res/img/upload' });

const myConfig = require("../lib/const/config.js");
const appConst = myConfig.appConst;

 /**
 * setting up pool of postgresql connection
 */ 
const db = require('../lib/pgpool.js');
const pool = db.getPool();

/* Start http protocal Interface section */
app.get('/', function(req, res) {
	/*
	res.clearCookie(appConst.cookieName);
	res.cookie(appConst.cookieName, appConst);
	console.log(colors.green('check cookie : ') + colors.yellow(JSON.stringify(req.cookies)));
	console.log(colors.green('phamaconst cookie check : ') + colors.yellow(JSON.stringify(req.cookies.phamaconst)));
	*/
	var phamaid = req.query.phamaid;
	var userId = req.query.userId;
	var destination = req.query.dest;
	doLoadShopid(phamaid).then(function(row) {
		res.status(200).render('layout/liff/review/phama.ejs', {
			shopid: row[0].shopid, phamaid: phamaid, appname: 'phama', userId: userId, destination: destination
		});
	});
})

app.get('/register', function(req, res) {
	var phamaid = req.query.phamaid;
	var userId = req.query.userId;
	var destination = req.query.dest;
	var shopid = req.query.shopid;
	res.status(200).render('layout/liff/review/register.ejs', {
		shopid: shopid, phamaid: phamaid, appname: 'phama', userId: userId, destination: destination
	});
});

app.post('/register/upload', upload.array('photos'), function(req, res) {
	var oldPath = req.files[0].destination + '/' + req.files[0].filename;
	var newPath = req.files[0].destination + '/shop/'  + req.files[0].originalname;
	//console.log(colors.blue('oldPath : ') + colors.yellow(JSON.stringify(oldPath)));
	//console.log(colors.blue('newPath : ') + colors.yellow(JSON.stringify(newPath)));
	var readStream = fs.createReadStream(oldPath);
	var writeStream = fs.createWriteStream(newPath);
	readStream.pipe(writeStream);
	var filename = req.files[0].originalname;
	res.status(200).send({status: {code: 200, detail: "OK"}, filename: filename});
});

app.post('/register/add', function(req, res) {
	console.log(colors.blue('req.body : ') + colors.yellow(JSON.stringify(req.body)));
	var savedata = req.body;
	doAddShop(savedata).then(function(newrow) {
		res.status(200).send({status: {code: 200, detail: "OK"}, id: newrow[0].id});
	});
});

app.post('/shopdata/(:shopid)', function(req, res) {
	var shopid = req.params.shopid;
	doLoadShopData(shopid).then(function(row) {
		res.status(200).send(row);
	});
});

app.post('/phamadata/(:phamaid)', function(req, res) {
	var phamaid = req.params.phamaid;
	doLoadPhamaData(phamaid).then(function(row) {
		//console.log(colors.green('phamadata : ') + colors.green(JSON.stringify(row)));
		res.status(200).send(row);
	});
});

app.post('/reviewlist/(:phamaid)', function(req, res) {
	var phamaid = req.params.phamaid;
	doLoadPhamaReviewList(phamaid).then(function(rows) {
		res.status(200).send(rows);
	});
});

app.post('/userid/(:userId)',function(req, res) {
	var userId = req.params.userId;
	doLoadUserid(userId).then(function(row) {
		//console.log(colors.green('userRow : ') + colors.green(JSON.stringify(row)));
		res.status(200).send(row);
	});
});

app.post('/postreview/(:phamaid)',function(req, res) {
	var phamaid = req.params.phamaid;
	var data = req.body;
	doAddReview(phamaid, data).then(function(row) {
		res.status(200).send(row);
	});
});

/* Internal Method */

function doLoadShopid(phamaid){
   	//console.log(colors.green('lpsid : ') + colors.green(JSON.stringify(lpsid)));
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "select  phamagroup.shopid from phamaitem, phamagroup where (phamaitem.groupid=phamagroup.id) and (phamaitem.id=$1)";
			client.query(sqlCmd, [phamaid]).then(res => {
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

function doLoadShopData(shopid){
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "select shop.*, lineconfig.liff_map as maplink from shop, lineconfig where (shop.id=lineconfig.shopid) and (shop.id=$1)";
			client.query(sqlCmd, [shopid]).then(res => {
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

function doLoadPhamaData(phamaid){
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "select phamaitem.id, phamaitem.name, phamaitem.description, phamaitem.picture, phamaitem.unit, phamaitem.price, phamaitem.exprice, phamagroup.gtype from phamaitem, phamagroup where  (phamaitem.groupid=phamagroup.id) and (phamaitem.id=$1)";
			client.query(sqlCmd, [phamaid]).then(res => {
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

function doLoadPhamaReviewList(phamaid){
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "select phamareview.*, u.lpsid, u.ldisplayname from phamareview, \"user\" u where (u.id = phamareview.userid) and (phamaid=$1) and (status='on') order by lastupd desc";
			client.query(sqlCmd, [phamaid]).then(res => {
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

function doLoadUserid(userId){
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "select id from \"user\" u where (u.lpsid = $1)";
			client.query(sqlCmd, [userId]).then(res => {
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

function doAddReview(phamaid, data){
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "insert into phamareview (phamaid, review, userid, status, lastupd) values ($1, $2, $3, 'off', now())  RETURNING id";
			client.query(sqlCmd, [phamaid, data.review, data.userid]).then(res => {
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

function doAddShop(data){
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "insert into shop (name, address, tel, url, slogan, userupd, lastupd) values ($1, $2, $3, $4,  $5, $6, now())  RETURNING id";
			client.query(sqlCmd, [data.name, data.address, data.tel, data.url, data.slogan, data.userid]).then(res => {
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