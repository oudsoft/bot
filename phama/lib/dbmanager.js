//dbmanager.js
const colors = require('colors/safe');
const util = require("util");
const fs = require('fs');
const url = require('url'); 
const path = require("path");
const lineapiconstlib = require("./lineapiconstlib.js");
const constlib = require('./constlib');
const myModule = require("./myModule.js");
const logger = require('./logger');

const db = require('./pgpool.js');
const pool = db.getPool();
const winpool = db.getWinPool();

exports.loadToken = function (laccId) {
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "select token, shopid from lineconfig where laccId=$1";
			client.query(sqlCmd, [laccId]).then(res => {
				if (res.rowCount > 0){
					client.query('COMMIT');
					resolve(res.rows);
				} else {
					resolve({});
				}
			}).catch(err => {
				client.query('ROLLBACK');
				logger().error(new Date()  + " >> DBMan Error Stack @loadToken >> " + err.stack);
				reject(err.stack)
			});
			client.release();
		});
	});
}

exports.loadShopToken = function (shopid) {
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "select token, laccId from lineconfig where shopid=$1";
			client.query(sqlCmd, [shopid]).then(res => {
				if (res.rowCount > 0){
					client.query('COMMIT');
					resolve(res.rows);
				} else {
					resolve({});
				}
			}).catch(err => {
				client.query('ROLLBACK');
				logger().error(new Date()  + " >> DBMan Error Stack @loadShopToken >> " + err.stack);
				reject(err.stack)
			});
			client.release();
		});
	});
}

exports.doLoadGroupMenu  = function (shopid){
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "select id, name, description, picture from phamagroup where (gtype <> 'serv') and  (gtype <> 'serc') and (status='on') and (shopid=$1) order by id limit 10 offset 0";
			client.query(sqlCmd, [shopid]).then(res => {
				if (res.rowCount > 0){
					client.query('COMMIT');
					resolve(res.rows);
				} else {
					resolve({});
				}
			}).catch(err => {
				client.query('ROLLBACK');
				logger().error(new Date()  + " >> DBMan Error Stack @doLoadGroupMenu >> " + err.stack);
				reject(err.stack)
			});
			client.release();
		});
	});
}

exports.doLoadMenu = function (groupid) {
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "select phamaitem.id, phamaitem.name, phamaitem.description, phamaitem.picture, phamaitem.unit, phamaitem.price, phamaitem.exprice, phamagroup.gtype from phamaitem, phamagroup where (phamaitem.groupid=phamagroup.id) and (phamaitem.status='on') and (phamaitem.groupid=$1) order by id limit 10 offset 0";
			client.query(sqlCmd, [groupid]).then(res => {
				if (res.rowCount > 0){
					client.query('COMMIT');
					resolve(res.rows);
				} else {
					resolve({});
				}
			}).catch(err => {
				client.query('ROLLBACK');
				logger().error(new Date()  + " >> DBMan Error Stack @doLoadMenu >> " + err.stack);
				reject(err.stack)
			});
			client.release();
		});
	});
}

exports.doGetMenu = function (itemid) {
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "select phamaitem.id, phamaitem.name, phamaitem.description, phamaitem.picture, phamaitem.unit, phamaitem.price, phamaitem.exprice, phamagroup.gtype, phamagroup.shopid from phamaitem, phamagroup where  (phamaitem.groupid=phamagroup.id) and (phamaitem.id=$1)";
			client.query(sqlCmd, [itemid]).then(res => {
				if (res.rowCount > 0){
					client.query('COMMIT');
					resolve(res.rows);
				} else {
					resolve({});
				}
			}).catch(err => {
				client.query('ROLLBACK');
				logger().error(new Date()  + " >> DBMan Error Stack @doGetMenu >> " + err.stack);
				reject(err.stack)
			});
			client.release();
		});
	});
}

exports.doSaveSubscribe = function(lpsid, ldisplayname) {
	return new Promise(function(resolve, reject) {
		doLoadSubscribe(lpsid).then(function(rows) {
			if(rows.length == 0) {
				doAddSubscribe(lpsid, ldisplayname);
			} else {
				doUpdateSubscribe(lpsid, ldisplayname);
			}
			resolve({code: 200});
		});
	});
}

exports.doLoadAdminShop = function (shopid) {
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "select u.lpsid from \"user\" u, role where (role.type='adm') and (role.userid=u.id) and (shopid=$1)";
			client.query(sqlCmd, [shopid]).then(res => {
				if (res.rowCount > 0){
					client.query('COMMIT');
					resolve(res.rows);
				} else {
					resolve({});
				}
			}).catch(err => {
				client.query('ROLLBACK');
				logger().error(new Date()  + " >> DBMan Error Stack @doLoadAdminShop >> " + err.stack);
				reject(err.stack)
			});
			client.release();
		});
	});
}

exports.doLoadShopName = function (shopid) {
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "select name from shop where id=$1";
			client.query(sqlCmd, [shopid]).then(res => {
				if (res.rowCount > 0){
					client.query('COMMIT');
					resolve(res.rows);
				} else {
					resolve({});
				}
			}).catch(err => {
				client.query('ROLLBACK');
				logger().error(new Date()  + " >> DBMan Error Stack @doLoadShopName >> " + err.stack);
				reject(err.stack)
			});
			client.release();
		});
	});
}

exports.doLoadShopData = function (shopid) {
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "select * from shop where id=$1";
			client.query(sqlCmd, [shopid]).then(res => {
				if (res.rowCount > 0){
					client.query('COMMIT');
					resolve(res.rows);
				} else {
					resolve({});
				}
			}).catch(err => {
				client.query('ROLLBACK');
				logger().error(new Date()  + " >> DBMan Error Stack @doLoadShopData >> " + err.stack);
				reject(err.stack)
			});
			client.release();
		});
	});
}

exports.loadPPData = function (shopid) {
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "select role.ppayno, role.ppaytype, role.fname, role.lname from shop, role where (shop.id=role.shopid) and  (role.ppayno <> '') and (shop.id=$1)";
			client.query(sqlCmd, [shopid]).then(res => {
				if (res.rowCount > 0){
					client.query('COMMIT');
					resolve(res.rows);
				} else {
					resolve({});
				}
			}).catch(err => {
				client.query('ROLLBACK');
				logger().error(new Date()  + " >> DBMan Error Stack @loadPPData >> " + err.stack);
				reject(err.stack)
			});
			client.release();
		});
	});
}

exports.doLoadMapLink = function (shopid) {
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "select liff_map as maplink from lineconfig where shopid=$1";
			client.query(sqlCmd, [shopid]).then(res => {
				client.query('COMMIT');
				resolve(res.rows);
			}).catch(err => {
				client.query('ROLLBACK');
				logger().error(new Date()  + " >> DBMan Error Stack @doLoadMapLink >> " + err.stack);
				reject(err.stack)
			});
			client.release();
		});
	});
}

exports.doLoadUserid = function (userId) {
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "select id as uid from \"user\" u where u.lpsid=$1";
			client.query(sqlCmd, [userId]).then(res => {
				client.query('COMMIT');
				resolve(res.rows);
			}).catch(err => {
				client.query('ROLLBACK');
				logger().error(new Date()  + " >> DBMan Error Stack @doLoadUserid >> " + err.stack);
				reject(err.stack)
			});
			client.release();
		});
	});
}

exports.doSaveOrderDB = function (orderData) {
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {		
			client.query('BEGIN');
			var sqlCmd = "insert into customer (userid, custname, custaddress, custtelno) values ()";
			client.query(sqlCmd, [orderData.userid, orderData.custname, orderData.custaddress, orderData.telno]).then(res => {
				client.query('COMMIT');
				resolve({code: 200});			
			}).catch(err => {
				client.query('ROLLBACK');
				logger().error(new Date()  + " >> DBMan Error Stack @doSaveOrder - insert cust >> " + err.stack);
				reject(err.stack)
			});
			client.release();
		});

		var jsonText = "";
		orderData.items.forEach((item, inx) => {
			jsonText = jsonText.concat("'" + JSON.stringify(item) + "'::json");
			if(inx < orderData.items.length-1) jsonText = jsonText.concat(",");
		});

		setTimeout(()=>{
			pool.connect().then(client => {
				client.query('BEGIN');
				var sqlCmd = "insert into \"order\" (shopid, userid, telno, ortype, oroption, discount, items, dtz) values ($1, $2, $3, $4, $5, $6, ARRAY [" + jsonText + "], now()) RETURNING id";
				//console.log(sqlCmd);
				client.query(sqlCmd, [orderData.shopid, orderData.userid, orderData.telno, orderData.type, orderData.option, orderData.discount]).then(res => {
					client.query('COMMIT');
					resolve(res.rows);
				}).catch(err => {
					client.query('ROLLBACK');
					logger().error(new Date()  + " >> DBMan Error Stack @doSaveOrder - insert order >> " + err.stack);
					reject(err.stack)
				});
				client.release();
			});
		},950);
	});
}

exports.doLoadLastOrderNo = function (shopid) {
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "select max(bill.orderno) as lono from bill, \"order\" o where (bill.orderid=o.id) and (o.shopid=$1) ";
			client.query(sqlCmd, [shopid]).then(res => {
				client.query('COMMIT');
				resolve(res.rows);
			}).catch(err => {
				client.query('ROLLBACK');
				logger().error(new Date()  + " >> DBMan Error Stack @doLoadLastOrderNo >> " + err.stack);
				reject(err.stack)
			});
			client.release();
		});
	});
}

exports.doLoadCustomer = function (userid) {
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "select cust.* from customer cust where (cust.userid=$1) order by cust.id";
			client.query(sqlCmd, [userid]).then(res => {
				client.query('COMMIT');
				resolve(res.rows);
			}).catch(err => {
				client.query('ROLLBACK');
				logger().error(new Date()  + " >> DBMan Error Stack @doLoadCustomer >> " + err.stack);
				reject(err.stack)
			});
			client.release();
		});
	});
}

exports.doAddNewBill = function (billData) {
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "insert into bill (orderid, orderno, paytype, payamount, dtz) values ($1, $2, $3, $4, now()) RETURNING id";
			client.query(sqlCmd, [billData.orderid, billData.orderno, billData.paytype, billData.payamount]).then(res => {
				client.query('COMMIT');
				resolve(res.rows);
			}).catch(err => {
				client.query('ROLLBACK');
				logger().error(new Date()  + " >> DBMan Error Stack @doAddNewBill >> " + err.stack);
				reject(err.stack)
			});
			client.release();
		});
	});
}

exports.loadOrderData = function (orderid) {
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "select * from \"order\" o where (o.id=$1) ";
			client.query(sqlCmd, [orderid]).then(res => {
				client.query('COMMIT');
				resolve(res.rows);
			}).catch(err => {
				client.query('ROLLBACK');
				logger().error(new Date()  + " >> DBMan Error Stack @loadOrderData >> " + err.stack);
				reject(err.stack)
			});
			client.release();
		});
	});
}

exports.loadBillData = function (billid) {
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "select * from bill where (id=$1) ";
			client.query(sqlCmd, [billid]).then(res => {
				client.query('COMMIT');
				resolve(res.rows);
			}).catch(err => {
				client.query('ROLLBACK');
				logger().error(new Date()  + " >> DBMan Error Stack @loadBillData >> " + err.stack);
				reject(err.stack)
			});
			client.release();
		});
	});
}

exports.doLoadLIFFBOF = function (shopid) {
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "select liff_bof from lineconfig where shopid=$1";
			client.query(sqlCmd, [shopid]).then(res => {
				if (res.rowCount > 0){
					client.query('COMMIT');
					resolve(res.rows);
				} else {
					resolve({});
				}
			}).catch(err => {
				client.query('ROLLBACK');
				logger().error(new Date()  + " >> DBMan Error Stack @doLoadLIFFBOF >> " + err.stack);
				reject(err.stack)
			});
			client.release();
		});
	});
}

exports.doLoadLIFFShopReview = function (shopid) {
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "select liff_rev from lineconfig where shopid=$1";
			client.query(sqlCmd, [shopid]).then(res => {
				if (res.rowCount > 0){
					client.query('COMMIT');
					resolve(res.rows);
				} else {
					resolve({});
				}
			}).catch(err => {
				client.query('ROLLBACK');
				logger().error(new Date()  + " >> DBMan Error Stack @doLoadLIFFShopReview >> " + err.stack);
				reject(err.stack)
			});
			client.release();
		});
	});
}

exports.doLoadLIFFPhamaReview = function (shopid) {
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "select liff_phamarev from lineconfig where shopid=$1";
			client.query(sqlCmd, [shopid]).then(res => {
				if (res.rowCount > 0){
					client.query('COMMIT');
					resolve(res.rows);
				} else {
					resolve({});
				}
			}).catch(err => {
				client.query('ROLLBACK');
				logger().error(new Date()  + " >> DBMan Error Stack @doLoadLIFFPhamaReview >> " + err.stack);
				reject(err.stack)
			});
			client.release();
		});
	});
}

exports.doLoadPostAddress = function (postcode) {
	return new Promise(function(resolve, reject) {
		winpool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "select token, shopid from lineconfig where laccId=$1";
			client.query(sqlCmd, [postcode]).then(res => {
				if (res.rowCount > 0){
					client.query('COMMIT');
					resolve(res.rows);
				} else {
					resolve({});
				}
			}).catch(err => {
				client.query('ROLLBACK');
				logger().error(new Date()  + " >> DBMan Error Stack @doLoadPostAddress >> " + err.stack);
				reject(err.stack)
			});
			client.release();
		});
	});
}

/* Inernal Method */
const doLoadSubscribe = function (lpsid) {
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "select id, ldisplayname from \"user\" where (lpsid=$1)";
			client.query(sqlCmd, [lpsid]).then(res => {
				client.query('COMMIT');
				resolve(res.rows);
			}).catch(err => {
				client.query('ROLLBACK');
				logger().error(new Date()  + " >> DBMan Error Stack @doLoadSubscribe >> " + err.stack);
				reject(err.stack)
			});
			client.release();
		});
	});
}

const doAddSubscribe = function (lpsid, ldisplayname) {
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "insert into \"user\" (lpsid, ldisplayname, lastupd) values ($1, $2, now()) RETURNING id";
			client.query(sqlCmd, [lpsid, ldisplayname]).then(res => {
				client.query('COMMIT');
				resolve(res.rows);
			}).catch(err => {
				client.query('ROLLBACK');
				logger().error(new Date()  + " >> DBMan Error Stack @doAddSubscribe >> " + err.stack);
				reject(err.stack)
			});
			client.release();
		});
	});
}

const doUpdateSubscribe = function (lpsid, ldisplayname) {
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "update \"user\" set ldisplayname=$1, lastupd=now() where lpsid=$2";
			client.query(sqlCmd, [ldisplayname, lpsid]).then(res => {
				client.query('COMMIT');
				resolve({code: 200});
			}).catch(err => {
				client.query('ROLLBACK');
				logger().error(new Date()  + " >> DBMan Error Stack @doUpdateSubscribe >> " + err.stack);
				reject(err.stack)
			});
			client.release();
		});
	});
}



/* Facebook Section */
exports.loadShopId = function (pageId) {
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "select shopid from msgrconfig where pageid=$1";
			client.query(sqlCmd, [pageId]).then(res => {
				client.query('COMMIT');
				resolve(res.rows);
			}).catch(err => {
				client.query('ROLLBACK');
				logger().error(new Date()  + " >> DBMan Error Stack @loadShopId >> " + err.stack);
				reject(err.stack)
			});
			client.release();
		});
	});
}