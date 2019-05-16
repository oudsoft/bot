//runshell.js

const exec = require('child_process').exec;
const colors = require('colors/safe');
const fs = require('fs');

exports.runcommand = function (command) {
	return new Promise(function(resolve, reject) {
		exec(command, (error, stdout, stderr) => {
			if(error === null) {
				resolve(`${stdout}`);
			} else {
				reject(`${stderr}`);
			}
        });
	});
}

exports.writefile = function (filename, data) {
	return new Promise(function(resolve, reject) {
		fs.writeFile(filename, data, function(error, data){
			if (error === null) {
				resolve({code: 200});
			} else {
				reject(`${error}`);
			}
		});
	});
}

exports.readfile = function (filename) {
	return new Promise(function(resolve, reject) {
		//console.log("hotopay path file name : " + colors.yellow(filename));
		fs.readFile(filename, 'utf-8' ,function(error, buf) {
			//console.log("hotopay data: " + colors.yellow(buf.toString()));
			if (error === null) {
				resolve(buf.toString());
			} else {
				reject(`${error}`);
			}
		});
	});
}

const redis = require('redis');
const redisClient = redis.createClient(); 
redisClient.on('connect', function(data) {
    console.log(colors.green('Redis client connected'));
});

redisClient.on('error', function (err) {
    console.log(colors.red('Something went wrong on Redis ' + err));
});

exports.redisSet = function (key, field, value){
	redisClient.hset("\"" + key + "\"", field, value);	
}

exports.redisGet = function (key, field){
	return new Promise(function(resolve, reject) {
		redisClient.hget("\"" + key + "\"", field, function (error, value) {	
			if (error) {	
				console.log('Redis Error ' + colors.red(error));
				reject(error);	
			} else {
				//console.log('Result IN -> ' + colors.yellow(JSON.stringify(value)));
				resolve(value);
			}
		});
	});
}

exports.redisDel = function (key, field){
	redisClient.del("\"" + key + "\"", field);
}