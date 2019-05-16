//shopreview.js
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
	var shopid = req.query.shopid;
	var userId = req.query.userId;
	var destination = req.query.dest;
	res.status(200).render('layout/liff/review/shop.ejs', {
		shopid: shopid, appname: 'phama', userId: userId, destination: destination
	});
})

app.post('/shopdata/(:shopid)', function(req, res) {
	var shopid = req.params.shopid;
	doLoadShopData(shopid).then(function(row) {
		res.status(200).send(row);
	});
});

app.post('/reviewlist/(:shopid)', function(req, res) {
	var shopid = req.params.shopid;
	doLoadShopReviewList(shopid).then(function(rows) {
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

app.post('/postreview/(:shopid)' ,function(req, res) {
	var shopid = req.params.shopid;
	var data = req.body;
	doAddReview(shopid, data).then(function(row) {
		res.status(200).send(row);
	});
});

app.post('/phamagrouplist/(:shopid)', function(req, res) {
	var shopid = req.params.shopid;
	doLoadGroupList(shopid).then(function(row) {
		res.status(200).send(row);
	});
});

app.post('/phamaitemlist/(:groupid)', function(req, res) {
	var groupid = req.params.groupid;
	doLoadItemList(groupid).then(function(row) {
		res.status(200).send(row);
	});
});

/* Internal Method */

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

function doLoadShopReviewList(shopid){
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "select shopreview.*, u.lpsid, u.ldisplayname from shopreview, \"user\" u where (u.id = shopreview.userid) and (shopreview.shopid=$1) and (shopreview.status='on') order by lastupd desc";
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

function doAddReview(shopid, data){
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "insert into shopreview (shopid, review, userid, status, lastupd) values ($1, $2, $3, 'off', now())  RETURNING id";
			client.query(sqlCmd, [shopid, data.review, data.userid]).then(res => {
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

function doLoadGroupList(shopid){
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "select * from phamagroup where (shopid =$1) and (status='on') order by id";
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

function doLoadItemList(groupid) {
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "select * from phamaitem where groupid =$1 order by id";
			client.query(sqlCmd, [groupid]).then(res => {
				if (res.rowCount > 0){
					client.query('COMMIT');
					resolve(res.rows);
				} else {
					resolve({status: {code: 220, detail: "Empty Record"}});
				}
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