//runsql.js

const colors = require('colors/safe');
const util = require("util");
const fs = require('fs');
const url = require('url'); 
const path = require("path");
const lineapiconstlib = require("./lineapiconstlib.js");
const constlib = require('./constlib');
const myModule = require("./myModule.js");

const db = require('./pgpool.js');
const pool = db.getPool();

var sql1 = "select to_char(tran.datetime, 'hh24:mi') as depart from schtran tran where (tran.status='open') and (to_char(tran.datetime, 'yyyy-mm-dd')=$1) and (tran.routeid=$2)  order by tran.datetime";
var params1 = ["2019-02-01", 5];
var sql2 = "select nor.depart from schnor nor where ((nor.day=$3) or (nor.day='all')) and (nor.routeid=$4)  order by nor.depart";
var params2 = ["fri", 5];

var sql3 = "select DISTINCT  depart from (" + sql1 + ") tranex union (" + sql2 + ") ORDER BY depart  limit 11 offset 0";
var params3 = params1.concat(params2);

var sql4 = "select DISTINCT depart from (" + sql1 + ") tranex union (" + sql2 + ")";

var sql5 = "select van.id, van.vanno from van, route, win where (van.status='Y') and (van.routeid=route.id) and (route.winid=win.id) and (win.id=$1) order by van.id"
var params5 = [1];

var sql6 = "select point.name, point.id, pricechart.terminalidf, terminal.id from pricechart, terminal, point where (pricechart.terminalidf=terminal.id) and (point.terminalid=terminal.id) and (point.status='Y') and (pricechart.id=$1)";
var params6 = [5];

var sql7 = "select * from booking where status='cancel' order by id";
var params7 = [];

var sql8 = "select route.id, route.winid, tt1.name as fromname, tt2.name as toname from route, terminal tt1, terminal tt2, schtran where (schtran.routeid = route.id) and (route.terminalidf=tt1.id) and (route.terminalidt =tt2.id) and (schtran.id =$1)";
var params8 = [9];

//console.log("sql 5: " + colors.yellow(sql5));
//console.log("params 5: " + colors.yellow(JSON.stringify(params5)));

doRunSql(sql8, params8).then(function(rows){
	rows.forEach(function(item){
		console.log("Rows: " + colors.yellow(JSON.stringify(item)));
	});
	console.log("Total Rows: " + colors.yellow(rows.length ));
	process.exit(0);
});

function doRunSql(sql, params){
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			client.query(sql, params).then(res => {
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
