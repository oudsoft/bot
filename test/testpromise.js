//testpromise.js
const colors = require('colors/safe');
const util = require("util");
const fs = require('fs');
const url = require('url'); 
const path = require("path");
const parentDir = path.normalize(__dirname+"/..");
//const db = require('./pgpool.js');
const db = require('../lib/pgpool.js');
const pool = db.getPool();

function doUpdateItem(sql, args) {
	return new Promise((resolve, reject) =>{
		pool.connect().then(client => {
			client.query('BEGIN');
			client.query(sql, args).then(res => {
				client.query('COMMIT');
				resolve(res.rows);
			}).catch(err => {
				client.query('ROLLBACK');
				reject(err);
			});
			client.release();
		});
	});
}

function doRunAsync(sql, args) {
    const promises = new Promise((resolve, reject) =>{
	doUpdateItem(sql, args).then((data) => {
		resolve(data);
	});
 });

    	return Promise.all([promises]);

}

async function doRun(){
	var sql = "select id, title from article";
	var args = [];
	const founds =  await doRunAsync(sql, args);
	console.log("Outter A " + JSON.stringify(founds));
	//return founds;
}

doRun();

//var sql = "select id, title from article";
//var args = [];
//var data = doRun(sql, args);
//console.log("Outter " + JSON.stringify(data));

