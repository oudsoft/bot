//createPromptpayQRCodePDF.js

const logger = require('./logger');
const constlib = require('./constlib');

const createPromptpayQRCodePDF = (qrtype, accountNo, accountName, totalCharge, apiSublink, callback = null) => {
	const creatorName = (apiSubLink === "line")? "Mr.QR" : "F4SME";
	const creatorLink = (apiSubLink === "line")? "โดยเพิ่ม Mr.QR เป็นเพื่อนในไลน์" : "ที่ m.me/f4sme";
	const qrcodetextgen = require('./qrcodetextgen');
	const {registerFont, createCanvas, createImageData} = require('canvas');
	registerFont('THSarabunNew.ttf', { family: 'THSarabunNew' })
	const pdfCanvas = createCanvas(400, 570,  'pdf');
	const qrcodeCanvas = createCanvas(400, 400);
	const ctx = pdfCanvas.getContext('2d');
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
	const QRCode = require('qrcode');
	QRCode.toCanvas(qrcodeCanvas, QRText, function (error) {
		//console.log(error);
		ctx.drawImage(qrcodeCanvas, 0, 0, 400, 400);
		var fs = require('fs');
		var pdfFileName = accountNo + "_" + totalCharge + new Date().getTime();
		var pdfFileExName = '.pdf';
		var pdfPath =  __dirname + "/"  + constlib.PDFDOWNLOAD_FOLDER + '/' + pdfFileName + pdfFileExName;
		const out = fs.createWriteStream(pdfPath);
		const stream = pdfCanvas.createPDFStream();
		stream.pipe(out);
		out.on('finish', () =>  {
			logger().info("The PDF file was created at: " + pdfPath + " >> " + new Date());
			var pdfLink = "https://www.myshopman.com/api/" + apiSublink + "/printfile?filename=" +pdfFileName + pdfFileExName;
			callback(pdfFileName, pdfLink);
		});
	});
}

module.exports = createPromptpayQRCodePDF;