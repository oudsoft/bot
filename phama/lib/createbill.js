//createbill.js
const logger = require('./logger');
const constlib = require('./constlib');
const myModule = require("./myModule.js");
const util = require("util");
const path = require("path");
const colors = require('colors/safe');
const parentDir = path.normalize(__dirname+"/..");

exports.createBill = function(oData, bData, sData, cData, total, payamount, cutomerName) {
	return new Promise(function(resolve, reject) {
		const {registerFont, createCanvas, createImageData} = require('canvas');
		registerFont('./res/font/THSarabunNew.ttf', { family: 'THSarabunNew' });
		//ต้องมีการคำนวณความสูงของ imageCanvas ไปจากจุดนี้
		const maxH = 1000;
		const maxW = 500;
		const imageCanvas = createCanvas(maxW, maxH);
		const ctx = imageCanvas.getContext('2d');
		ctx.globalAlpha = 0.8;
		//ctx.fillStyle = "yellow";
		ctx.fillStyle = "slategray";
		ctx.fillRect(0,0,maxW,maxH);
		ctx.fill();

		const logoCanvas = require('canvas');
		var logoPath =  parentDir + '/res/img/logo/shop/' + oData.shopid + '/' + oData.shopid + '.jpg';
		var logoImage = new logoCanvas.Image; 
		logoImage.src = logoPath;
		ctx.drawImage(logoImage, 170, 10, 160, 100);

		ctx.font = 'bold 40px "THSarabunNew"'
		//ctx.fillStyle = 'black';
		//ctx.fillStyle = 'white';
		ctx.fillStyle = 'yellow';
		ctx.textAlign = 'center';
		ctx.fillText(sData.name, 250, 150);

		ctx.font = 'bold 20px "THSarabunNew"'
		ctx.textAlign = 'left';
		ctx.fillText(sData.address, 30, 170);
		ctx.fillText("โทรศัพท์ " + sData.tel, 30, 190);
		ctx.fillText(sData.slogan, 30, 210);

		ctx.font = 'bold 30px "THSarabunNew"'
		ctx.fillText("เลขที่ " + bData.orderno, 10, 250);
		var textFormater = util.format("วันที่ : %s เวลา : %s น." ,  myModule.formatCustomerDate(bData.dtz), myModule.formatCustomerTime(bData.dtz));
		ctx.fillText(textFormater, 10, 280);
		textFormater = util.format("ลูกค้า ชื่อ %s" ,  cData.custname +" [" + cutomerName + "]");
		ctx.fillText(textFormater, 10, 310);
		textFormater = util.format("ที่อยู่ %s" ,  cData.custaddress);
		ctx.fillText(textFormater, 10, 340);
		textFormater = util.format("โทรศัพท์ %s" ,  cData.custaddress);
		ctx.fillText(textFormater, 10, 370);

		var lineMarker = 0;
		var startMarkAt = 400;
		var lineH = 30;
		var items = oData.items;
		var totalBill = 0;
		var disc = Number(oData.discount);

		items.forEach(function(item, ind){
			var json = item;
			var totalItem = Number(json.amount*json.itemprice);
			var shortItemName;
			if(json.itemname.length > 20) {	
				shortItemName = json.itemname.substr(0, 20) + "...";
			} else {
				shortItemName = json.itemname;
			}
			totalBill += totalItem;
			lineMarker =startMarkAt + (ind*lineH);

			textFormater = util.format("%s. %s จำนวน %s %s = %s บาท ", (ind+1), shortItemName, json.amount, json.itemunit, totalItem.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,'));
			ctx.fillText(textFormater, 10, lineMarker);
		});

		textFormater = util.format("รวมทั้งหมด %s บาท ", totalBill.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,'));
		lineMarker = lineMarker + lineH + 10;
		ctx.fillText(textFormater, 10, lineMarker);

		textFormater = util.format("ส่วนลด %s บาท ", disc.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,'));
		lineMarker = lineMarker + lineH;
		ctx.fillText(textFormater, 10, lineMarker);

		totalBill = totalBill - disc;
		textFormater = util.format("รวมสุทธิ %s บาท ", totalBill.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,'));
		lineMarker = lineMarker + lineH + 20;
		ctx.font = 'bold 40px "THSarabunNew"'
		ctx.fillText(textFormater, 10, lineMarker);

		textFormater = util.format("รับมา %s บาท ", Number(payamount).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,'));
		lineMarker = lineMarker + lineH + 10;
		ctx.font = 'bold 30px "THSarabunNew"'
		ctx.fillText(textFormater, 10, lineMarker);

		textFormater = util.format("เงินทอน %s บาท ", (payamount-totalBill).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,'));
		lineMarker = lineMarker + lineH;
		ctx.fillText(textFormater, 10, lineMarker);

		textFormater = util.format("วิธีชำระ %s ", doConvPaytype(bData.paytype));
		lineMarker = lineMarker + lineH;
		ctx.fillText(textFormater, 10, lineMarker);

		ctx.font = 'bold 40px "THSarabunNew"'
		ctx.textAlign = 'center';
		lineMarker = lineMarker + lineH + 20;
		ctx.fillText("ขอบพระคุณเป็นอย่างสูง", 250, lineMarker);

		console.log("Last Line: " + lineMarker);

		lineMarker = lineMarker + lineH
		const shopQRCanvas = require('canvas');
		var shopQRPath =  parentDir + '/res/img/logo/shop/' + oData.shopid + '/' + 'qr.png';
		var shopQRImage = new shopQRCanvas.Image; 
		shopQRImage.src = shopQRPath;
		ctx.drawImage(shopQRImage, 190, lineMarker, 120, 120);

		/*
			หาวิธีมา trim ความสูงส่วนเกินออก
		*/
		var fs = require('fs');
		var imageFileName = "BLL" + doFillShopNo(oData.shopid) + bData.orderno;

		var imageFileExName = '.png';

		var imagePath =  parentDir + '/res/img/' + constlib.QRDOWNLOAD_FOLDER + '/' + imageFileName + imageFileExName;
		const out = fs.createWriteStream(imagePath);
		const stream = imageCanvas.createPNGStream();
		stream.pipe(out);
		out.on('finish', () =>  {
			var imageLink = "https://www.myshopman.com/phama/img/" + constlib.QRDOWNLOAD_FOLDER + "/" + imageFileName + imageFileExName;
			resolve(imageLink);
		});
	});
}

function doFillShopNo(shopid){
	var cnoS = String(shopid);
	var cl = cnoS.length;
	var out = "";
	var i = 0;
	while (i + cl < 3)	{
		 out =  out.concat("0");
		 i++;
	}
	return out.concat(cnoS);
}

function doConvPaytype(value){
	if(value=="1") {
		return "เงินสด";
	} else if (value=="2") {
		return "พร้อมเพย์";
	}
}