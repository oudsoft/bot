const express = require('express');
const bodyParser = require('body-parser');
const logger = require('./logger');
const constlib = require('./constlib');

app = express();
 
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
 
app.listen(8989, () => console.log('Promptpay QR-Code bot listening on port 8989!'));
 
app.get('/', (req, res) => res.send('Hello World!'));

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

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {
 
    // Your verify token. Should be a random string.
    let VERIFY_TOKEN = "cool-bot";
 
    // Parse the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];
 
    // Checks if a token and mode is in the query string of the request
    if (mode && token) {
 
        // Checks the mode and token sent is correct
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
 
            // Responds with the challenge token from the request
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
 
        } else {
            // Responds with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    }
});

// Creates the endpoint for our webhook
app.post('/webhook', (req, res) => {
 
    let body = req.body;
 
    if (body.object === 'page') {
 
        // Iterates over each entry - there may be multiple if batched
        body.entry.forEach(function(entry) {
 
            // Gets the message. entry.messaging is an array, but
            // will only ever contain one message, so we get index 0
            let webhook_event = entry.messaging[0];
            console.log(webhook_event);
 
            // Get the sender PSID
            let sender_psid = webhook_event.sender.id;
            //console.log('Sender PSID: ' + sender_psid);
 
            // Check if the event is a message or postback and
            // pass the event to the appropriate handler function
            if (webhook_event.message) {
                //console.log(webhook_event.message)
				handleMessage(sender_psid, webhook_event.message);
            } else if (webhook_event.postback) {
                //console.log(webhook_event.postback)
				handlePostback(sender_psid, webhook_event.postback);
            }
        });
 
        // Returns a '200 OK' response to all requests
        res.status(200).send('EVENT_RECEIVED');
    } else {
        // Returns a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404);
    }
 });

let promptpayNames;
let promptpayFName, promptpayLName;
let promptpayType;
let promptpayNo;
let payAmount;
let qrType;

 // Handles messages events - will handle incoming messages
const handleMessage = (sender_psid, received_message) => {
    let response;
 
    if (received_message.text) {
		let text = received_message.text.trim().toUpperCase();;
		promptpayNames = received_message.text.trim().split(" ");

		if(text.toUpperCase() === 'QR'){
			//callUserProfileAPI(sender_psid, function(res) {
				//response = askTemplate('สวัสดีครับ คุณ ' + res.first_name + " " + res.last_name + ' เชิญเลือกประเภทพร้อมเพย์ก่อนเลยครับ');
				response = askTemplate('สวัสดีครับ ' + '\nเชิญเลือกประเภทพร้อมเพย์ก่อนเลยครับ');
				callSendAPI(sender_psid, response);
			//});

		} else if ((text.length === 10) && (Number(text)  > 0)) {
			promptpayNo = text;
			response = "โอเค ขอบคุณมากครับ สำหรับหมายเลขโทรศัพท์\n ต่อไปผมขอทราบ ชื่อ นามสกุล เจ้าของหมายเลขพร้อมเพย์ " + text + " ด้วยครับ\n(พิมพ์ชื่อ เว้นวรรค แล้วตามด้วยนามสกุลครับ)\nเข่น สมพร พร้อมมูล เป็นต้น";
			callSendTextAPI(sender_psid, response);
		} else if ((text.length === 13) && (Number(text)  > 0)) {
			promptpayNo = text;
			response = "โอเค ขอบคุณมากครับ สำหรับหมายเลขประจำตัวประชาชน\n ต่อไปผมขอทราบ ชื่อ นามสกุล เจ้าของหมายเลขพร้อมเพย์ " + text + " ด้วยครับ\n(พิมพ์ชื่อ เว้นวรรค แล้วตามด้วยนามสกุลครับ)\nเข่น สมพร พร้อมมูล เป็นต้น";
			callSendTextAPI(sender_psid, response);
		} else if ((text.length === 15) && (Number(text)  > 0)) {
			promptpayNo = text;
			response = "โอเค ขอบคุณมากครับ สำหรับหมายเลข e-Wallet\n ต่อไปผมขอทราบ ชื่อ นามสกุล เจ้าของหมายเลขพร้อมเพย์ " + text + " ด้วยครับ\n(พิมพ์ชื่อ เว้นวรรค แล้วตามด้วยนามสกุลครับ)\nเข่น สมพร พร้อมมูล เป็นต้น";
			callSendTextAPI(sender_psid, response);
		} else if (promptpayNames.length  === 2) {
			promptpayFName = promptpayNames[0]; 
			promptpayLName = promptpayNames[1];
			response = "ขอบคุณมากครับ สำหรับ ชื่อ นามสกุล เจ้าของหมายเลขพร้อมเพย์ " + text + "\n สุดท้ายแล้วครับ ผมขอทราบยอดจำนวนเงิน(บาท) ที่ต้องการโอนครับ\n(พิมพ์แต่ตัวเลขจำนวนเงิน(บาท) เช่น 100, 250.50, 1000 หรือ 2525.75 แบบนี้เป็นต้น ครับ)";
			callSendTextAPI(sender_psid, response);
		} else if ((text.search("ขอบคุณ") >= 0) | (text.search("สุดยอด") >= 0)){
			response = "ด้วยความยินดีครับ\nหากเห็นว่าเพจนี้มีประโยชน์ ก็รบกวนช่วยแชร์ช่วยไลค์ก็พอครับ คนอื่นจะได้มาใช้ด้วย\nหรือหากมีคำแนะนำติชมใดๆ รวมทั้งมีปัญหาการใช้งาน พิมพ์เครื่องหมาย * แล้วตามด้วยข้อความส่งเข้ามาได้เลยครับ ";
			callSendTextAPI(sender_psid, response);
		} else if (text.charAt(0) === "*") {
			response = "ขอบคุณมากเลยครับ\nแล้วผมจะแจ้งให้เจ้านายของผมติดต่อกลับไปโดยเร็วที่สุดครับ";
			callSendTextAPI(sender_psid, response);
		} else if ((text.length > 0) && (Number(text)  > 0)) {
			payAmount = text;
			response = "ขอบคุณมากครับ สำหรับข้อมูลทั้งหมดที่จะนำไปสร้างพร้อมเพย์คิวอาร์โค้ด ขอสรุปดังนี้นะครับ\n";
			response = response.concat("เป็นพร้อมเพย์ประเภท: " + promptpayType + "\n");
			response = response.concat("หมายเลขพร้อมเพย์: " + promptpayNo + "\n");
			response = response.concat("ชื่อ นามสกุล เจ้าของพร้อมเพย์: " + promptpayFName + " " + promptpayLName + "\n");
			response = response.concat("ยอดโอนจำนวน: " + Number(payAmount).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,')  + " บาท" + "\n");
			callSendTextAPI(sender_psid, response);
			response = askTemplateYesNo('ข้อมูลถูกต้องไหมครับ?');
			callSendAPI(sender_psid, response);
		} else {
			logger().info("* " + " >> " + sender_psid + " >> " + text  + " >> " + new Date());
			response = "ผมไม่เข้าใจคำสั่งครับ\nหากต้องการสร้างพร้อมเพย์คิวอาร์โค้ดพิมพ์ \"QR\" หรือ \"qr\" เข้ามาเลยครับ\nผมรับทำให้ด้วยความยินดี";
			callSendTextAPI(sender_psid, response);
		}
		logger().info(">> " + sender_psid + " >> " + text + " >> " + new Date());
    }
}
 
// Handles postback  events - will handle incoming postbacks
const handlePostback = (sender_psid, received_postback) => {
    let response;
	let countConfirm = 0;
	if (countConfirm ==0){

		// Get the payload for the postback
		let payload = received_postback.payload.trim().toUpperCase();
	 
		// Set the response based on the postback payload
		if ((payload === 'หมายเลขโทรศัพท์') | (payload === 'TELEPHONE_NO')) {
			promptpayType = "หมายเลขโทรศัพท์";
			qrType = "01";
			response = "งั้น ผมขอทราบหมายเลขโทรศัพท์เลยครับ (พิมพ์เฉพาะหมายเลขโทรศัพท์อย่างเดียวนะครับ ไม่ต้องมีตัวอักษร ไม่ต้องมีขีด หรืออื่นๆ ปนเข้ามา เช่น 0801254466 แบบนี้เป็นต้น)";
			callSendTextAPI(sender_psid, response);
		} else if ((payload === 'หมายเลขประจำตัวประชาชน')  | (payload === 'CITIZENT_NO')) {
			promptpayType = "หมายเลขประจำตัวประชาชน";
			qrType = "02";
			response = "งั้น ผมขอทราบหมายเลขประจำตัวประชาชนเลยครับ (พิมพ์เฉพาะหมายเลขประจำตัวประชาชนอย่างเดียวนะครับ ไม่ต้องมีตัวอักษร ไม่ต้องมีขีด หรืออื่นๆ ปนเข้ามา เช่น 1900900999900 แบบนี้เป็นต้น)";
			callSendTextAPI(sender_psid, response);
		} else if ((payload === 'หมายเลข e-Wallet') | (payload === 'EWALLET_NO')) {
			promptpayType = "หมายเลข e-Wallt";
			qrType = "03";
			response = "งั้น ผมขอทราบหมายเลข e-Wallt เลยครับ (พิมพ์เฉพาะหมายเลข e-Wallt อย่างเดียวนะครับ ไม่ต้องมีตัวอักษร ไม่ต้องมีขีด หรืออื่นๆ ปนเข้ามา เช่น 180000862221213 แบบนี้เป็นต้น)";
			callSendTextAPI(sender_psid, response);
		} else if(payload === 'QR'){
			response = askTemplate('สวัสดีครับ ' + ' เชิญเลือกประเภทพร้อมเพย์ก่อนเลยครับ');
			callSendAPI(sender_psid, response);
		} else if  ((payload === 'ขอแก้ไข') | (payload === 'NO.')) {
			response = askTemplate('โอเค\n' + 'เชิญเลือกประเภทพร้อมเพย์ใหม่อีกครั้งครับ และป้อนข้อมูลด้วยความระมัดระวังนะครับ');
			callSendAPI(sender_psid, response);
		} else if  ((payload === 'ถูกต้อง') | (payload === 'YES.')) {
			if (countConfirm == 0){
				response = "โปรดรอสักครู่... \nผมจะดำเนินการสร้างพร้อมเพย์คิวอาร์โค้ดให้ครับ";
				callSendTextAPI(sender_psid, response,  function() {
					var accountNo = promptpayNo;
					var accountName = promptpayFName + " " + promptpayLName;
					var totalCharge = payAmount;
					const createPromptpayQRCode = require('./createPromptpayQRCode');
					const apiSublink = "fbmessager";
					createPromptpayQRCode(qrType, accountNo, accountName, totalCharge, apiSublink, function(filename, imageLink) {
						countConfirm++;
						callSendImageAPI(sender_psid, imageLink);
						const createPromptpayQRCodePDF = require('./createPromptpayQRCodePDF');
						createPromptpayQRCodePDF(qrType, accountNo, accountName, totalCharge, apiSublink, function(filename, pdfLink) {
							callSendTextAPI(sender_psid, "ดาวน์โหลดพร้อมเพย์คิวอาร์โค้ดของคุณเพื่อพิมพ์ออกทางเครื่องพิมพ์ได้ที่\n" + pdfLink);
							const savedata = require('./savedata');
							savedata('fb', sender_psid, qrType, accountNo, accountName, Number(totalCharge), filename, 'Y', 'Y');
						});
					});
				});
			}
		} else {
			logger().info("* " + payload + " >> " + new Date());
			response = "ผมไม่เข้าใจคำสั่งครับ\nหากต้องการสร้างพร้อมเพย์คิวอาร์โค้ดพิมพ์ \"QR\" หรือ \"qr\" เข้ามาเลยครับ\nผมรับทำให้ด้วยความยินดี";
			callSendTextAPI(sender_psid, response);
		}
		logger().info(">> " + sender_psid + " >> " + payload  + " >> " + new Date());
		countConfirm++;
	}
}

const askTemplate = (text) => {
    return {
        "attachment":{
            "type":"template",
            "payload":{
                "template_type":"button",
                "text": text,
                "buttons":[
                    {
                        "type":"postback",
                        "title":"หมายเลขโทรศัพท์",
                        "payload":"TELEPHONE_NO"
                    },
                    {
                        "type":"postback",
                        "title":"หมายเลขประจำตัวประชาชน",
                        "payload":"CITIZENT_NO"
                    },
                    {
                        "type":"postback",
                        "title":"หมายเลข e-Wallet",
                        "payload":"EWALLET_NO"
                    }
                ]
            }
        }
    }
}
 
const askTemplateYesNo = (text) => {
    return {
        "attachment":{
            "type":"template",
            "payload":{
                "template_type":"button",
                "text": text,
                "buttons":[
                    {
                        "type":"postback",
                        "title":"ถูกต้อง",
                        "payload":"Yes."
                    },
                    {
                        "type":"postback",
                        "title":"ขอแก้ไข",
                        "payload":"No."
                    }
                ]
            }
        }
    }
}

// Sends response messages via the Send API
const request = require('request');
const config = require('config');
const callSendAPI = (sender_psid, response, cb = null) => {
    // Construct the message body
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": response
    };
 
    // Send the HTTP request to the Messenger Platform
    request({
        "uri": "https://graph.facebook.com/v2.6/me/messages",
        "qs": { "access_token": config.get('facebook.page.access_token') },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
            if(cb){
				if (body){
					console.log(JSON.stringify(body));
					cb(JSON.parse(body));
				}
            }
        } else {
            console.error("Unable to send message:" + err);
        }
    });
}

const callUserProfileAPI = (user_psid, cb = null) => {
	let getUserProfile_uri = "https://graph.facebook.com/" + user_psid + "?fields=first_name,last_name,profile_pic&access_token=" + config.get('facebook.page.access_token');
    request({
        "uri": getUserProfile_uri,
        "method": "GET"
    }, (err, res, body) => {
        if (!err) {
            if(cb){
				if (body){
					console.log(JSON.stringify(body));
					//console.log(JSON.stringify(res));
					cb(JSON.parse(body));
				}
            }
        } else {
            console.error("Unable to send message:" + err);
        }
    });
}

const callSendTextAPI = (user_psid, text_toSend, cb = null) => {
	let getSendTextAPI_uri = "https://graph.facebook.com/v2.6/me/messages?access_token=" + config.get('facebook.page.access_token');
    // Construct the message body
    let request_body = {
		  "messaging_type": "RESPONSE",
		  "recipient": {
			"id": user_psid
		  },
		  "message": {
			"text": text_toSend
		  }
	 };

    // Send the HTTP request to the Messenger Platform
    request({
        "uri": getSendTextAPI_uri,
        "qs": { "access_token": config.get('facebook.page.access_token') },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
            if(cb){
				if (body){
					console.log(JSON.stringify(body));
					//console.log(JSON.stringify(res));
					cb();
				}
            }
        } else {
            console.error("Unable to send message:" + err);
        }
    });
}

const callSendImageAPI = (user_psid, imageLink, cb = null) => {
	let getSendImageAPI_uri = "https://graph.facebook.com/v2.6/me/messages?access_token=" + config.get('facebook.page.access_token');
    // Construct the message body
    let request_body = {
	  "recipient":{
		"id":user_psid
	  },
	  "message":{
		"attachment":{
		  "type":"image", 
		  "payload":{
			"url":imageLink, 
			"is_reusable":true
		  }
		}
	  }
  };

    request({
        "uri": getSendImageAPI_uri ,
        "qs": { "access_token": config.get('facebook.page.access_token') },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
            if(cb){
				if (body){
					console.log(JSON.stringify(body));
					//console.log(JSON.stringify(res));
					cb();
				}
            }
        } else {
            console.error("Unable to send message:" + err);
        }
    });
}


/* ต
	Thank you author of this blog very mush. For idea that give me a new life.
	https://quantizd.com/building-facebook-messenger-bot-with-nodejs/
	Start node qr.js as service
	pm2 start node fbqr.js
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

