//createppqr.js
const logger = require('./logger');
const constlib = require('./constlib');
const myModule = require("./myModule.js");
const util = require("util");
const path = require("path");
const colors = require('colors/safe');
const parentDir = path.normalize(__dirname+"/..");

exports.createPPQR = function(data, netAmount) {
	return new Promise(function(resolve, reject) {
		const {registerFont, createCanvas, createImageData} = require('canvas');
		registerFont('./res/font/THSarabunNew.ttf', { family: 'THSarabunNew' });
		//ต้องมีการคำนวณความสูงของ imageCanvas ไปจากจุดนี้
		const maxH = 380;
		const maxW = 400;
		const imageCanvas = createCanvas(maxW, maxH);
		const ctx = imageCanvas.getContext('2d');
		ctx.globalAlpha = 0.8;
		ctx.fillStyle = "yellow";
		ctx.fillRect(0,0,maxW,maxH);
		ctx.fill();

		const qrcodetextgen = require('./qrcodetextgen');
		var QRText =  qrcodetextgen.generateQRCodeText(data.ppaytype, data.ppayno, netAmount); 
		const QRCode = require('qrcode');
		const qrcodeCanvas = createCanvas(200, 200);
		QRCode.toCanvas(qrcodeCanvas, QRText, function (error) {
			var qrH = 200;
			ctx.drawImage(qrcodeCanvas, 100, 20, qrH, qrH);
			ctx.font = 'bold 30px "THSarabunNew"'
			ctx.fillStyle = 'black';
			ctx.textAlign = 'left';

			var textFormater = util.format("หมายเลขพร้อมเพย์ %s ", data.ppayno);
			ctx.fillText(textFormater, 10, 250);

			textFormater = util.format("ชื่อบัญชี  %s %s", data.fname, data.lname);
			ctx.fillText(textFormater, 10, 280);

			textFormater = util.format("จำนวนเงิน %s บาท", Number(netAmount).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,'));
			ctx.fillText(textFormater, 10, 310);

			ctx.font = 'bold 40px "THSarabunNew"'
			ctx.textAlign = 'center';
			ctx.fillText("ขอขอบคุณ", 200, 340);

			ctx.font = 'bold 25px "THSarabunNew"'
			ctx.textAlign = 'left';
			var today = new Date();
			textFormater = util.format("ออก ณ วันที่ : %s เวลา : %s น." ,  myModule.formatCustomerDate(today), myModule.formatCustomerTime(today));
			ctx.fillText(textFormater, 10, (maxH-10));

			var fs = require('fs');
			var imageFileName = "QR" + today.getTime();

			var imageFileExName = '.png';

			var imagePath =  parentDir + '/res/img/' + constlib.QRDOWNLOAD_FOLDER + '/' + imageFileName + imageFileExName;
			const out = fs.createWriteStream(imagePath);
			const stream = imageCanvas.createPNGStream();
			stream.pipe(out);
			out.on('finish', () =>  {
				var imageLink = "https://www.myshopman.com/food/img/" + constlib.QRDOWNLOAD_FOLDER + "/" + imageFileName + imageFileExName;
				resolve(imageLink);
			});
		});
	});
}