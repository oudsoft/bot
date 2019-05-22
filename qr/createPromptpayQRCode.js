//createPromptpayQRCode.js

const logger = require('./logger');
const constlib = require('./constlib');

const createPromptpayQRCode = (qrtype, accountNo, accountName, totalCharge, apiSubLink, callback = null) => {
	const creatorName = (apiSubLink === "line")? "Mr.QR" : "F4SME";
	const creatorLink = (apiSubLink === "line")? "โดยเพิ่ม Mr.QR เป็นเพื่อนในไลน์" : "ที่ m.me/f4sme";

	const qrcodetextgen = require('./qrcodetextgen');
	const {registerFont, createCanvas, createImageData} = require('canvas');
	registerFont('THSarabunNew.ttf', { family: 'THSarabunNew' })
	const imageCanvas = createCanvas(400, 570);
	const qrcodeCanvas = createCanvas(400, 400);
	const ctx = imageCanvas.getContext('2d');
	/***********************/
	//for filling color background
	ctx.globalAlpha = 0.8;
	ctx.fillStyle = "yellow";
    ctx.fillRect(0,0,400,570);
	ctx.fill();
	//for filling creatorName logo
	//ctx.font = 'bold 100px "THSarabunNew"'
	//ctx.fillStyle = 'green';
	//ctx.textAlign = 'center';
	//ctx.strokeText(creatorName, 200, 520);
	//ctx.globalAlpha = 1.0;
	/***********************/
	ctx.font = 'bold 30px "THSarabunNew"'
	ctx.fillStyle = 'black';
	ctx.textAlign = 'left';
	ctx.fillText("หมายเลขพร้อมเพย์  " + accountNo, 10, 430);
	ctx.fillText("ชื่อบัญชี " + accountName, 10, 460);
	ctx.fillText("มูลค่าการโอน : " + Number(totalCharge).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,') + " บาท", 10, 490);
	ctx.textAlign = 'center';
	ctx.fillText("ขอบคุณที่ใช้บริการ " + creatorName, 200, 523);

	ctx.font = 'bold 20px "THSarabunNew"'
	ctx.fillStyle = 'black';
	ctx.textAlign = 'left';
	ctx.fillText("คนไทยทุกคนเข้ามาสร้างพร้อมเพย์คิวอาร์โค้ดได้ฟรี " + creatorLink, 10, 550);

	var QRText =  qrcodetextgen.generateQRCodeText(qrtype, accountNo, totalCharge); 
	logger().info(qrtype  + " >> " + QRText + " >> " + new Date());
	const QRCode = require('qrcode');
	QRCode.toCanvas(qrcodeCanvas, QRText, function (error) {
		//console.log(error);
		ctx.drawImage(qrcodeCanvas, 0, 0, 400, 400);
		var fs = require('fs');
		var imageFileName = accountNo + "_" + totalCharge + new Date().getTime();
		var imageFileExName = '.png';
		var imagePath =  __dirname + "/"  + constlib.QRDOWNLOAD_FOLDER + '/' + imageFileName + imageFileExName;
		const out = fs.createWriteStream(imagePath);
		const stream = imageCanvas.createPNGStream();
		stream.pipe(out);
		out.on('finish', () =>  {
			logger().info("The PNG file was created at: " + imagePath + " >> " + new Date());
			var imageLink = "https://www.myshopman.com/api/" + apiSubLink + "/download?imagename=" +imageFileName + imageFileExName;
			callback(imageFileName, imageLink);
		});
	});
}
/* see rotate text manner at */
//https://stackoverflow.com/questions/3167928/drawing-rotated-text-on-a-html5-canvas

module.exports = createPromptpayQRCode;
