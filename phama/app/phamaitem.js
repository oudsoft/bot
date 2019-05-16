//phamaitem.js
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
	res.status(200).render('layout/liff/phamaitem.ejs', {title: appConst.appTitle, appname: appConst.appName });
})

app.post('/allgroup', function(req, res, next) {
	var shopid = req.cookies.phamaconst[0].shopid;
	doLoadGroupList(shopid).then(function(rows) {
		res.status(200).send(rows);
	});
});

app.post('/itemlist/(:groupid)', function(req, res, next) {
	var groupid = req.params.groupid;
	doLoadItemList(groupid).then(function(rows) {
		res.status(200).send(rows);
	});
});

app.post('/upload/(:itemid)', upload.array('photos'), function(req, res, next) {
	var itemid = req.params.itemid;
	var shopid = req.cookies.phamaconst[0].shopid;

	var oldPath = req.files[0].destination + '/' + req.files[0].filename;
	var newPath = req.files[0].destination + '/'  + shopid + "/item/" + req.files[0].originalname;

	var readStream = fs.createReadStream(oldPath);
	var writeStream = fs.createWriteStream(newPath);

	readStream.pipe(writeStream);

	var filename = req.files[0].originalname;
	//console.log(colors.blue('itemid : ') + colors.yellow(JSON.stringify(itemid)));
	doUpdateItemPicture(itemid, filename).then(function(sts) {
		//res.send(req.files);
		res.status(200).send({status: {code: 200, detail: "OK"}, filename: filename});
	});
});

app.post('/edit/(:itemid)', function(req, res, next) {
	var itemid = req.params.itemid;
	var data = req.body;
   	console.log(colors.green('data : ') + colors.green(JSON.stringify(data)));
	doUpdateItem(itemid, data).then(function(sts) {
		res.status(200).send({status: {code: 200, detail: "OK"}});
	}).catch(function(error) {
		res.status(200).send({status: {code: 500, detail: "Not OK"}});
	});
})

app.post('/delete/(:itemid)', function(req, res, next) {
   	//console.log(colors.green('req body : ') + colors.green(JSON.stringify(req.body)));
	var itemid = req.params.itemid;
	doDeleteItem(itemid).then(function(sts) {
		res.status(200).send({status: {code: 200, detail: "OK"}});
	}).catch(function(error) {
		res.status(200).send({status: {code: 500, detail: "Not OK"}});
	});
})

app.post('/add', function(req, res, next) {
   	//console.log(colors.green('req body : ') + colors.green(JSON.stringify(req.body)));
	var shopid = req.cookies.phamaconst[0].shopid;
	var data = req.body;
	doAddItem(data).then(function(newid) {
		res.status(200).send({status: {code: 200, detail: "OK"}, newid: newid});
	}).catch(function(error) {
		res.status(200).send({status: {code: 500, detail: "Not OK"}});
	});
})

app.post('/item/(:itemid)', function(req, res, next) {
	var itemid = req.params.itemid;
	doLoadItem(itemid).then(function(row) {
		res.status(200).send(row);
	});
});

/* Internal Method*/
function doLoadGroupList(shopid){
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "select id, name from phamagroup where shopid =$1 order by id";
			client.query(sqlCmd, [shopid]).then(res => {
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

function doLoadItemList(groupid){
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

function doUpdateItemPicture(itemid, filename) {
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "update phamaitem set picture=$1 where id =$2";
			client.query(sqlCmd, [filename, itemid]).then(res => {
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

function doUpdateItem(itemid, data) {
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "update phamaitem set name=$1, description=$2, unit=$3, price=$4, exprice= $5, status=$6 where id =$7";
			client.query(sqlCmd, [data.name, data.description, data.unit, data.price, data.exprice, data.status, itemid]).then(res => {
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

function doDeleteItem(itemid){
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "delete from phamaitem where id =$1";
			client.query(sqlCmd, [itemid]).then(res => {
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

function doAddItem(data) {
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "insert into phamaitem (name, description, picture, unit, price, exprice, status, groupid) values ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id";
			client.query(sqlCmd, [data.name, data.description,'', data.unit, data.price, data.exprice, data.status, data.groupid]).then(res => {
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

function doLoadItem(itemid){
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "select id, name, unit, price, exprice from phamaitem where id =$1";
			client.query(sqlCmd, [itemid]).then(res => {
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