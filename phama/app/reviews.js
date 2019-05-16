//reviews.js
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
	res.status(200).render('layout/liff/reviews.ejs', {title: appConst.appTitle, appname: appConst.appName });
})

app.get('/foodreviewlist/(:foodid)', function(req, res) {
	var foodid = req.params.foodid;
	doLoadMenuReviwList(foodid).then(function(revRows) {
		res.status(200).send(revRows);
	});
});

app.post('/foodreviewstatus/(:itemid)', function(req, res) {
	var itemid = req.params.itemid;
	var value = req.body.status;
	doUpdateReviwStatus(itemid, value).then(function(code) {
		res.status(200).send(code);
	});
});

app.post('/shopreviewlist', function(req, res) {
	var shopid = req.cookies.foodconst[0].shopid;
	doLoadShopReviwList(shopid).then(function(revRows) {
		res.status(200).send(revRows);
	});
});

app.post('/shopreviewstatus/(:itemid)', function(req, res) {
	var itemid = req.params.itemid;
	var value = req.body.status;
	doUpdateShopReviewStatus(itemid, value).then(function(revRows) {
		res.status(200).send(revRows);
	});
});

app.post('/foodreviewdelete/(:itemid)', function(req, res) {
	var itemid = req.params.itemid;
	doDeleteFoodReview(itemid).then(function() {
		res.status(200).send({code: 200});
	});
});

app.post('/shopreviewdelete/(:itemid)', function(req, res) {
	var itemid = req.params.itemid;
	doDeleteShopReview(itemid).then(function() {
		res.status(200).send({code: 200});
	});
});

/* Internal Method */

function doLoadMenuReviwList(foodid){
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "select foodreview.*, u.lpsid, u.ldisplayname from foodreview, \"user\" u where (foodreview.userid=u.id) and (foodreview.foodid=$1)";
			client.query(sqlCmd, [foodid]).then(res => {
				client.query('COMMIT');
				resolve(res.rows);
			}).catch(err => {
				client.query('ROLLBACK');
				logger().error(new Date()  + " >> review.js Error Stack @doLoadMenuReviwList >> " + err.stack);
				reject(err.stack)
			});
			client.release();
		});
	});
}

function doUpdateReviwStatus(itemid, value){
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "update foodreview set status=$1 where (id=$2)";
			client.query(sqlCmd, [value, itemid]).then(res => {
				client.query('COMMIT');
				resolve({code: 200});
			}).catch(err => {
				client.query('ROLLBACK');
				logger().error(new Date()  + " >> review.js Error Stack @doUpdateReviwStatus >> " + err.stack);
				reject(err.stack)
			});
			client.release();
		});
	});
}

function doLoadShopReviwList(shopid) {
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "select shopreview.*, u.lpsid, u.ldisplayname from shopreview, \"user\" u where (shopreview.userid=u.id) and (shopreview.shopid=$1)";
			client.query(sqlCmd, [shopid]).then(res => {
				client.query('COMMIT');
				resolve(res.rows);
			}).catch(err => {
				client.query('ROLLBACK');
				logger().error(new Date()  + " >> review.js Error Stack @doLoadShopReviwList >> " + err.stack);
				reject(err.stack)
			});
			client.release();
		});
	});
}

function doUpdateShopReviewStatus(itemid, value){
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "update shopreview set status=$1 where (id=$2)";
			client.query(sqlCmd, [value, itemid]).then(res => {
				client.query('COMMIT');
				resolve({code: 200});
			}).catch(err => {
				client.query('ROLLBACK');
				logger().error(new Date()  + " >> review.js Error Stack @doUpdateShopReviwStatus >> " + err.stack);
				reject(err.stack)
			});
			client.release();
		});
	});
}

function doDeleteFoodReview(itemid){
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "delete from foodreview where id=$1";
			client.query(sqlCmd, [itemid]).then(res => {
				client.query('COMMIT');
				resolve({code: 200});
			}).catch(err => {
				client.query('ROLLBACK');
				logger().error(new Date()  + " >> review.js Error Stack @doDeleteFoodReview >> " + err.stack);
				reject(err.stack)
			});
			client.release();
		});
	});
}

function doDeleteShopReview(itemid){
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "delete from shopreview where id=$1";
			client.query(sqlCmd, [itemid]).then(res => {
				client.query('COMMIT');
				resolve({code: 200});
			}).catch(err => {
				client.query('ROLLBACK');
				logger().error(new Date()  + " >> review.js Error Stack @doDeleteShopReview >> " + err.stack);
				reject(err.stack)
			});
			client.release();
		});
	});
}

//* Export App Module */

module.exports = app;