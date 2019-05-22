
const bodyParser = require('body-parser');
var express = require('express');
var http = require('http');
var app = express();

const QRDOWNLOAD_FOLDER = 'qrdownload';

app.engine('html', require('ejs').renderFile);//for render html file in views folder
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()); 

//app.get('/shop/api', function (request, response) {
app.get('/qrimage', function(request, response) {
	//var accountNo = promptpayNo;
	//var accountName = promptpayFName + " " + promptpayLName;
	//var totalCharge = payAmount;
	var accountNo = "0835077746";
	var totalCharge = "500.00";
	var accountName = "นายประเสริฐ สุดชดา";
	var qrType = "01";

	const createPromptpayQRCode = require('./createPromptpayQRCode');
	const apiSublink = "line";
	createPromptpayQRCode(qrType, accountNo, accountName, totalCharge, apiSublink, function(filename, imageLink) {
		response.status(200).send("<img src='"+imageLink+"'/><br/>"+imageLink);
	});
});


app.get('/webapp', function(request, response) {
    response.render('index.html');
});

app.get('/download', function(request, response){
	var fileName = request.query.imagename;
	var file = __dirname + '/' + QRDOWNLOAD_FOLDER + '/' + fileName;
	response.download(file); 
});

var server = app.listen(7751, function () {
	var host = server.address().address;
	var port = server.address().port;
	console.log("Example app listening at http://%s:%s", host, port);
});

/*
scp /cygdrive/e/nodep/server.js sasurean@202.28.68.6:/home/sasurean/nodejs
scp /cygdrive/e/nodep/hosts sasurean@202.28.68.6:/etc/hosts

curl -X GET -H "Content-Type:application/json" -H "X-MyHeader: 123" http://202.28.68.6/shop/api -d '{"text":"something"}'
curl -X POST -H "Content-Type:application/json" -H "X-MyHeader: 123" http://202.28.68.6/qrimage -d '{"accountNo": "140000835077746", "accountName": "นายประเสริฐ สุดชดา", "totalCharge": "377.12"}'

/etc/init.d/apache2 restart
service apache2 restart


cd nodejs
node server.js

Navigate to folder and
chmod -R 777 .
*/

