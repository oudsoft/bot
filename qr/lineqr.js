const express = require('express');
const bodyParser = require('body-parser');
const request = require('request-promise');
const logger = require('./logger');
const constlib = require('./constlib');
const app = express();


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
 
app.listen(7979, () => console.log('Promptpay QR-Code bot listening on port 7979!'));
 
app.get('/', (req, res) => res.send('Hello World!'));

const LINE_MESSAGING_API = 'https://api.line.me/v2/bot/message';
const LINE_HEADER = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer EsfJVKfSfM6XdGBJJQiziyCzMyAVJYhCEPbth2OU+XTUG8l/YlIX3bufvU44npXCCkW/Ki9/POEHi5LGRUKHmlHkTAmUodiLH93vr7Tya0WVSRNFHV6mKVvuA0/PbzLnxlSiDfCpZH+nAkJwRO3YmAdB04t89/1O/w1cDnyilFU='
};


let promptpayNames;
let promptpayFName, promptpayLName;
let promptpayType;
let promptpayNo;
let payAmount;
let qrType;


// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {
	res.status(200).send("OK");
});

// Creates the endpoint for our webhook
app.post('/webhook', (req, res) => {
	console.log(JSON.stringify(req.body));
	let replyToken = req.body.events[0].replyToken;
	console.log(replyToken);
	let userId = req.body.events[0].source.userId;
	let replyMessage;
	//replyMessage = req.body.events[0].message.text;
	if (req.body.events[0].message) {
		//Message
		if (req.body.events[0].message.type === 'text') {
			var userText = req.body.events[0].message.text;
			promptpayNames = userText.trim().split(" ");
			if (userText.toUpperCase() === "QR") {
				replyPostBack(replyToken, postBackSelectQRType());
			} else if ((userText.length === 10) && (Number(userText)  > 0)) {
				promptpayNo = userText;
				replyMessage = "โอเค ขอบคุณมากครับ สำหรับหมายเลขโทรศัพท์\n ต่อไปผมขอทราบ ชื่อ นามสกุล เจ้าของหมายเลขพร้อมเพย์ " + userText + " ด้วยครับ\n(พิมพ์ชื่อ เว้นวรรค แล้วตามด้วยนามสกุลครับ)\nเข่น สมพร พร้อมมูล เป็นต้น";
				replyText(replyToken, replyMessage);
			} else if ((userText.length === 13) && (Number(userText)  > 0)) {
				promptpayNo = userText;
				replyMessage = "โอเค ขอบคุณมากครับ สำหรับหมายเลขประจำตัวประชาชน\n ต่อไปผมขอทราบ ชื่อ นามสกุล เจ้าของหมายเลขพร้อมเพย์ " + userText + " ด้วยครับ\n(พิมพ์ชื่อ เว้นวรรค แล้วตามด้วยนามสกุลครับ)\nเข่น สมพร พร้อมมูล เป็นต้น";
				replyText(replyToken, replyMessage);
			} else if ((userText.length === 15) && (Number(userText)  > 0)) {
				promptpayNo = userText;
				replyMessage = "โอเค ขอบคุณมากครับ สำหรับหมายเลข e-Wallet\n ต่อไปผมขอทราบ ชื่อ นามสกุล เจ้าของหมายเลขพร้อมเพย์ " + userText + " ด้วยครับ\n(พิมพ์ชื่อ เว้นวรรค แล้วตามด้วยนามสกุลครับ)\nเข่น สมพร พร้อมมูล เป็นต้น";
				replyText(replyToken, replyMessage);
			} else if (promptpayNames.length  === 2) {
				promptpayFName = promptpayNames[0]; 
				promptpayLName = promptpayNames[1];
				replyMessage = "ขอบคุณมากครับ สำหรับ ชื่อ นามสกุล เจ้าของหมายเลขพร้อมเพย์ " + userText + "\n สุดท้ายแล้วครับ ผมขอทราบยอดจำนวนเงิน(บาท) ที่ต้องการโอนครับ\n(พิมพ์แต่ตัวเลขจำนวนเงิน(บาท) เช่น 100, 250.50, 1000 หรือ 2525.75 แบบนี้เป็นต้น ครับ)";
				replyText(replyToken, replyMessage);
			} else if ((userText.search("ขอบคุณ") >= 0) | (userText.search("สุดยอด") >= 0)){
				replyMessage = "ด้วยความยินดีครับ\nหากเห็นว่า Mr.QR มีประโยชน์ ก็รบกวนช่วยแชร์ต่อๆ กันไปก็พอครับ คนอื่นจะได้มาใช้ด้วย\nหรือหากมีคำแนะนำติชมใดๆ รวมทั้งมีปัญหาการใช้งาน พิมพ์เครื่องหมาย * แล้วตามด้วยข้อความส่งเข้ามาได้เลยครับ ";
				replyText(replyToken, replyMessage);
			} else if (userText.charAt(0) === "*") {
				replyMessage = "ขอบคุณมากเลยครับ\nแล้วผมจะแจ้งให้เจ้านายของผมติดต่อกลับไปโดยเร็วที่สุดครับ";
				replyText(replyToken, replyMessage);
			} else if ((userText.length > 0) && (Number(userText)  > 0)) {
				payAmount = userText;
				replyMessage = "ขอบคุณมากครับ สำหรับข้อมูลทั้งหมดที่จะนำไปสร้างพร้อมเพย์คิวอาร์โค้ด ขอสรุปดังนี้นะครับ\n";
				replyMessage = replyMessage.concat("เป็นพร้อมเพย์ประเภท: " + promptpayType + "\n");
				replyMessage = replyMessage.concat("หมายเลขพร้อมเพย์: " + promptpayNo + "\n");
				replyMessage = replyMessage.concat("ชื่อ นามสกุล เจ้าของพร้อมเพย์: " + promptpayFName + " " + promptpayLName + "\n");
				replyMessage = replyMessage.concat("ยอดโอนจำนวน: " + Number(payAmount).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,')  + " บาท" + "\n");
				replyMessage = replyMessage.concat("\nข้อมูลถูกต้องไหมครับ?\nโปรดยืนยันความถูกต้องด้วยการเลือก ถูกต้อง หรือ ขอแก้ไข หากไม่ถูกต้อง");
				replyPostBack(replyToken, postBackConfirmYesNo(replyMessage));
			} else {
				logger().info("* " + " >> " + sender_psid + " >> " + userText  + " >> " + new Date());
				replyMessage = "ผมไม่เข้าใจคำสั่งครับ\nหากต้องการสร้างพร้อมเพย์คิวอาร์โค้ดพิมพ์ \"QR\" หรือ \"qr\" เข้ามาเลยครับ\nผมรับทำให้ด้วยความยินดี";
				replyText(replyToken, replyMessage);
			}

		} else {
			logger().info("* " + userId + " >> " + req.body.events[0].message.text + " >> "  + new Date());
			replyMessage = "ผมไม่เข้าใจคำสั่งครับ\nหากต้องการสร้างพร้อมเพย์คิวอาร์โค้ดพิมพ์ \"QR\" หรือ \"qr\" เข้ามาเลยครับ\nผมรับทำให้ด้วยความยินดี";
			replyText(replyToken, replyMessage);
		}
	} else {
		//Postback
		if (req.body.events[0].postback) {
			var cmds = req.body.events[0].postback.data.split("&");
			//action=buy&itemid=03
			var qrtype =cmds[1].split("=");
			if (qrtype[1] === "01") {
				promptpayType = "หมายเลขโทรศัพท์";
				qrType = "01";
				replyMessage = "งั้น ผมขอทราบหมายเลขโทรศัพท์เลยครับ (พิมพ์เฉพาะหมายเลขโทรศัพท์อย่างเดียวนะครับ ไม่ต้องมีตัวอักษร ไม่ต้องมีขีด หรืออื่นๆ ปนเข้ามา เช่น 0801254466 แบบนี้เป็นต้น)";
				replyText(replyToken, replyMessage);
			}else if (qrtype[1] === "02") {
				promptpayType = "หมายเลขประจำตัวประชาชน";
				qrType = "02";
				replyMessage = "งั้น ผมขอทราบหมายเลขประจำตัวประชาชนเลยครับ (พิมพ์เฉพาะหมายเลขประจำตัวประชาชนอย่างเดียวนะครับ ไม่ต้องมีตัวอักษร ไม่ต้องมีขีด หรืออื่นๆ ปนเข้ามา เช่น 1900900999900 แบบนี้เป็นต้น)";
				replyText(replyToken, replyMessage);
			}else if (qrtype[1] === "03") {
				promptpayType = "หมายเลข e-Wallt";
				qrType = "03";
				replyMessage = "งั้น ผมขอทราบหมายเลข e-Wallt เลยครับ (พิมพ์เฉพาะหมายเลข e-Wallt อย่างเดียวนะครับ ไม่ต้องมีตัวอักษร ไม่ต้องมีขีด หรืออื่นๆ ปนเข้ามา เช่น 180000862221213 แบบนี้เป็นต้น)";
				replyText(replyToken, replyMessage);
			}else if (qrtype[1] === "04") {
				var question = 'โอเค\n' + 'เชิญเลือกประเภทพร้อมเพย์ใหม่อีกครั้งครับ และป้อนข้อมูลด้วยความระมัดระวังนะครับ';
				replyPostBack(replyToken, postBackSelectQRType(question));
			}else if (qrtype[1] === "05") {
				replyMessage =  "โปรดรอสักครู่... \nผมจะดำเนินการสร้างพร้อมเพย์คิวอาร์โค้ดให้ครับ";
				replyText(replyToken, replyMessage);
				var accountNo = promptpayNo;
				var accountName = promptpayFName + " " + promptpayLName;
				var totalCharge = payAmount;
				const createPromptpayQRCode = require('./createPromptpayQRCode');
				const apiSublink = "line";
				createPromptpayQRCode(qrType, accountNo, accountName, totalCharge, apiSublink, function(filename, imageLink) {
					pushImage(userId, imageLink, imageLink);
					const createPromptpayQRCodePDF = require('./createPromptpayQRCodePDF');
					createPromptpayQRCodePDF(qrType, accountNo, accountName, totalCharge, apiSublink, function(filename, pdfLink) {
						var question = "ดาวน์โหลดพร้อมเพย์คิวอาร์โค้ดของคุณเพื่อพิมพ์ออกทางเครื่องพิมพ์ได้ที่\n" + pdfLink;
						question = question.concat('\nหากยังต้องการสร้างพร้อมเพย์คิวอาร์โค้ดอีก เชิญเลือกประเภทพร้อมเพย์ได้เลย');
						question = question.concat('\nหากไม่มีประเภทพร้อมเพย์ขึ้นให้เลือก พิมพ์ qr หรือ QR ส่งเข้ามาใหม่ได้เลยครับ');
						pushPostBack(userId, postBackSelectQRType(question));
						const savedata = require('./savedata');
						savedata('line', userId, qrType, accountNo, accountName, Number(totalCharge), filename, 'Y', 'Y');
					});
				});
			}
		}
	}
 });

app.get('/download', function(request, response){
	var fileName = request.query.imagename;
	var file = __dirname + '/' + constlib.QRDOWNLOAD_FOLDER + '/' + fileName;
	response.download(file); 
});

app.get('/printfile', function(request, response){
	var fileName = request.query.filename;
	var file = __dirname + '/' + constlib.PDFDOWNLOAD_FOLDER + '/' + fileName;
	response.download(file); 
});

const replyText = (token, message) => {
	return request({
		method: 'POST',
		uri: LINE_MESSAGING_API + "/reply",
		headers: LINE_HEADER,
		body: JSON.stringify({
			replyToken: token,
			messages: [
				{
					type: 'text',
					text: message
				}
			]
		})
	});
};

const replyPostBack = (token, postBackObject) => {
	return request({
		method: 'POST',
		uri: LINE_MESSAGING_API + "/reply",
		headers: LINE_HEADER,
		body: JSON.stringify({
			replyToken: token,
			messages: [postBackObject]
		})
	});
}

const pushMessage = (userid, msg) => {
	return request({
		method: 'POST',
		uri: LINE_MESSAGING_API + "/push",
		headers: LINE_HEADER,
		body: JSON.stringify({
			to: userid,
			messages: [
				{
					type: "text",
					text: msg
				}
			]
		})
	});
}

const pushImage = (userid, originURL, previewURL) => {
	return request({
		method: 'POST',
		uri: LINE_MESSAGING_API + "/push",
		headers: LINE_HEADER,
		body: JSON.stringify({
			to: userid,
			messages: [
				{
					type: "image",
					originalContentUrl: originURL,
					previewImageUrl: previewURL
				}
			]
		})
	});
}

const pushPostBack = (userid, postBackObject) => {
	return request({
		method: 'POST',
		uri: LINE_MESSAGING_API + "/push",
		headers: LINE_HEADER,
		body: JSON.stringify({
			to: userid,
			messages: [postBackObject]
		})
	});
}

const postBackSelectQRType = (question) => {
	return {
	  type: "text",
	  text: (question)? question : "ผม Mr.QR สวัสดีและยินดีให้บริการ\n"  + "เชิญเลือกประเภทพร้อมเพย์ก่อนเลยครับ\nคุณต้องการสร้างพร้อมเพย์คิวอาร์โค้ดจากหมายเลขประเภทไหน?",
	  quickReply: {
		items: [
			  {
				type: "action",
				action: {
				  type: "postback",
				  label: "เบอร์โทรศัพท์",
				  data: "action=buy&itemid=01",
				  displayText: "TELEPHONENO"
					}
				},
			  {
				type: "action",
				action: {
				  type: "postback",
				  label: "บัตรประชาชน",
				  data: "action=buy&itemid=02",
				  displayText: "CITIZENTNO"
					}
				},
			  {
				type: "action",
				action: {
				  type: "postback",
				  label: "e-Wallet",
				  data: "action=buy&itemid=03",
				  displayText: "EWALLETNO"
					}
				}
			]
		} 
	}
};

const postBackConfirmYesNo = (question) => {
	return {
	  type: "text",
	  text:  (question)? question : "ข้อมูลถูกต้องไหมครับ?\nโปรดยืนยันความถูกต้องด้วยการเลือก ถูกต้อง หรือ ขอแก้ไข หากไม่ถูกต้อง",
	  quickReply: {
		items: [
			  {
				type: "action",
				action: {
				  type: "postback",
				  label: "ถูกต้อง",
				  data: "action=buy&itemid=05",
				  displayText: "YES"
					}
				},
			  {
				type: "action",
				action: {
				  type: "postback",
				  label: "ขอแก้ไข",
				  data: "action=buy&itemid=04",
				  displayText: "NO"
					}
				}
			]
		} 
	}
};



/* ต
	Thank you author of this blog very mush. For idea that give me a new life.
	https://quantizd.com/building-facebook-messenger-bot-with-nodejs/
	Start node qr.js as service
	pm2 start node lineqr.js
	Stop
	pm2 list
	pm2 stop app_name_or_id
	Restart
	pm2 restart app_name_or_id
	https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-16-04
*/

/*
	kill node process
	ps aux | grep node
	Find the process ID (second from the left):

	kill -9 PROCESS_ID
	This may also work

	killall node
*/

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

