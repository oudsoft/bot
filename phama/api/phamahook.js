//phamahook.js
const colors = require('colors/safe');
const util = require("util");
const fs = require('fs');
const url = require('url'); 
const path = require("path");
const parentDir = path.normalize(__dirname+"/..");

const request = require('request-promise');
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const app = express();

const db = require('../lib/pgpool.js');
const pool = db.getPool();

const lineconnector = require("../lib/lineapiconnect.js");
const dbman = require("../lib/dbmanager.js");
const myModule = require("../lib/myModule.js");
const logger = require('../lib/logger');
const libapi = require('../lib/webhookapi.js');
/*
const liff_bof = "line://app/1573475591-l0X46Gxz";
const liff_foodreview = "line://app/1559859637-rw42LRxb";
const liff_shopreview = "line://app/1566943098-Raj7dNJ0";
*/

/*********************************************/
/*  Start END_POINT API Phama Bot */
/*********************************************/
app.get('/', function(req, res) {
	console.log("req.query " + colors.yellow(JSON.stringify(req.query)));
	logger().info(new Date()  + " >> req.query>> " + JSON.stringify(req.query));
	res.status(200).send("OK");
});

app.post('/', function(req, res) {
	console.log("req.body " + colors.yellow(JSON.stringify(req.body)));
	logger().info(new Date()  + " >> req.body>> " + JSON.stringify(req.body));
	/*
	res.status(200).send("OK");
	*/
	let replyToken = req.body.events[0].replyToken;
	let userId = req.body.events[0].source.userId;
	let destination = req.body.destination;
	let replyMessage;
	var question;
	if (req.body.events[0].type === 'message') {
		if (req.body.events[0].message.type === 'text') {
			libapi.doGetSession(userId, "tempBotStatus").then(function(botStatus){
				console.log("botStatus " + botStatus);
				if (botStatus === 'on'){
					var userText = req.body.events[0].message.text;
					libapi.textMessageHandle(userId, replyToken, userText, req, res);
				}
			});
		} else if (req.body.events[0].message.type == 'image') {
			libapi.doGetSession(userId, "tempBotStatus").then(function(botStatus){
				if (botStatus === 'on'){
					//verify Customer Image Slip
					var imageId = req.body.events[0].message.id;
					//console.log(colors.blue("check: ") + colors.blue(imageId));
					libapi.imageMessageHandle(userId, replyToken, destination, imageId);
				}
			});
		} else {
	       logger().info(new Date()  + " >> req.query Unkhown Type>> " + JSON.stringify(req.query));
		}
	} else if (req.body.events[0].type == 'postback') {
		libapi.doGetSession(userId, "tempBotStatus").then(function(botStatus){
			if (botStatus === 'on'){
				var cmds = req.body.events[0].postback.data.split("&");
				libapi.postbackMessageHandle(userId, replyToken, cmds, req);
			}
		});
	} else if (req.body.events[0].type == 'follow') {
		libapi.doGetTokenBot(destination).then(function(botToken) {
			libapi.doGetSession(destination, "shopid").then(function(shopid){
				dbman.doLoadShopName(shopid).then(function(shopName){
					lineconnector.getUserProfile(userId, botToken).then(function(userdata) {
						var userProfile = JSON.parse(userdata);
						var displayName = userProfile.displayName;
						dbman.doSaveSubscribe(userId, displayName).then(function(code) {
							var intro = "สวัสดีครับคุณ " + displayName + "\n" + shopName[0].name + " เป็นเกียรติอย่างยิ่งที่ได้รับใช้คุณ\nโปรดเลือกทำรายการจากเมนูด้านล่างได้เลยครับ";
							lineconnector.replyPostBack(replyToken, botToken, lineconnector.createBotMenu(intro, libapi.mainmenu));
							libapi.doDeleteSession(userId).then(function(stscode) {
								libapi.doUpdateSession(userId, "tempMode", "normal");
								libapi.doUpdateSession(userId, "tempBotStatus", "on");
								libapi.doUpdateSession(userId, "tempCustStatus", "normal");
							});
						});
					});
				});
			});
		});
	} else if (req.body.events[0].type == 'unfollow') {
		libapi.doDeleteSession(userId);
	} 
});

app.get('/userprofile/(:userId)/(:destination)', function(req, res) {
	var userId = req.params.userId;
	var destination = req.params.destination;
	//console.log('userId : ', userId);
	libapi.doGetTokenBot(destination).then(function(botToken) {
		lineconnector.getUserProfile(userId, botToken).then(function(userdata) {
			var userProfile = JSON.parse(userdata);
			var displayName = userProfile.displayName;
			var pictureUrl = userProfile.pictureUrl;
			//console.log('userProfile : ', JSON.stringify(userProfile));
			res.status(200).send({displayName: displayName, pictureUrl: pictureUrl});
		});
	});
});

app.get('/orderviews/(:shopid)', function(req, res) {
	var shopid = req.params.shopid;
	sessionHolders.keys("*", function (err, keys) {
		var promiseList = new Promise(function(resolve,reject){
			var orders = [];
			if (err) return console.log(err);
			keys.forEach(function(key){
				sessionHolders.hgetall(key, function (err, result) {
					if(result.tempOrder) {
						var order = result;
						order.userId = key;
						//console.log("order -> " + JSON.stringify(order));
						orders.push(order);
						myModule.delay(450);
					}
				});
			});
			setTimeout(()=>{
				resolve(orders);
			},1200);
		});
		Promise.all([promiseList]).then((ob)=>{
			res.status(200).send(ob[0]);
		});
	});       
});

app.get('/deleteorder/(:lpsid)', function(req, res) {
	var key = req.params.lpsid;
	libapi.doDeleteSessionField(key, "tempOrder");
	res.status(200).send({code: 200});
});

app.get('/deleteorderitem/(:lpsid)/(:itemid)/(:amount)', function(req, res) {
	var userId = req.params.lpsid;
	var itemid = req.params.itemid;
	var amount = req.params.amount;
	libapi.doGetSession(userId, "tempOrder").then(function(result){
		var orders = JSON.parse(result);
		var newOrder = orders.filter(function(item){
			if(item){ return (item.itemid != itemid) && (item.amount != amount); }
		});
		libapi.doUpdateSession(userId, "tempOrder", JSON.stringify(newOrder));
		res.status(200).send({code: 200});
	});
});

app.get('/changestatusorderitem/(:lpsid)/(:itemid)/(:amount)/(:itemstatus)', function(req, res) {
	var userId = req.params.lpsid;
	var itemid = req.params.itemid;
	var amount = req.params.amount;
	var itemstatus = req.params.itemstatus;
	libapi.doGetSession(userId, "tempOrder").then(function(result){
		var orders = JSON.parse(result);
		orders.forEach(function(item){
			if((item.itemid == itemid) && (item.amount == amount)) {
				item.itemstatus = 	itemstatus;
			}
		});
		libapi.doUpdateSession(userId, "tempOrder", JSON.stringify(orders));
		res.status(200).send({code: 200});
	});
});

app.get('/discountorder/(:lpsid)/(:discount)', function(req, res) {
	var userId = req.params.lpsid;
	var discount = req.params.discount;
	//console.log(colors.blue("discount : ") + colors.yellow(discount));
	libapi.doUpdateSession(userId, "tempDiscount", discount);
	res.status(200).send({code: 200});
});

app.post('/additem/(:lpsid)', function(req, res) {
	var userId = req.params.lpsid;
	var newOrder = req.body;
	libapi.doGetSession(userId, "tempOrder").then(function(result){
		var orders;
		if(result){
			orders = JSON.parse(result);
		} else {
			orders = [];
		}
		orders.push(newOrder);
		libapi.doUpdateSession(userId, "tempOrder",  JSON.stringify(orders));
		res.status(200).send({code: 200});
	});
});

app.post('/closebill/(:userId)/(:shopid)/(:destination)', function(req, res) {
	var userId = req.params.userId;
	var shopid = req.params.shopid;
	var destination = req.params.destination;
	var paytype = req.body.paytype;
	var netAmount = req.body.netAmount;
	libapi.doUpdateSession(userId, "tempPaytype",  paytype);
	//console.log(colors.blue("paytype : ") + colors.yellow(JSON.stringify(paytype)));
	libapi.doGetTokenBot(destination).then(function(botToken) {
		libapi.doGetSession(userId, "tempOrder").then(function(result){
			var sumText = "ทางร้านของเรามีความยินดีที่จะแจ้งยอดค่าใช้จ่ายทั้งหมดของคุณ ดังนี้\n"
			libapi.checkBillText(userId, function(sText){
				libapi.doGetSession(userId, "tempDiscount").then(function(discount){
					var dText = "";
					if(Number(discount) == 0){
						dText = sText.concat("\n(หมายเหตุ ค่าอาหารจริงๆทั้งหมด อาจน้อยกว่านี้ เนื่องจากขณะนี้ทางร้านยังไม่ได้กำหนดส่วนลดให้แก่คุณ\nคุณสามารถติดต่อขอรับบิลของจริงได้จากทางร้านครับ)");
						dText = dText.concat("\nหากต้องการใช้บริการอื่นๆ ขอเชิญเลือกได้จากเมนูด้านล่างครับ");
					} else {
						dText = sText;
					}
					sumText = sumText.concat(dText);
					/* ของจริงต้องส่ง message ไปให้ adminShop ยืนยันความถูกต้องของค่าใช้จ่ายทั้งหมดอีกที โดยให้ user confirm ว่าของบิลจริงจากร้าน*/
					sumText = sumText.concat("\nทางร้านขอขอบคุณมากครับ");
					if(paytype=="1"){
						sumText = sumText.concat("\nเรายังมีบริการอื่นๆ ซึ่งคุณสามารถเรียกใช้ได้จากเมนูครับ");
						lineconnector.pushPostBack(userId, botToken, lineconnector.createBotMenu(sumText, libapi.mainmenu)); 
					}else if(paytype=="2"){
						lineconnector.pushMessage(userId, botToken, sumText).then(function(code){
							libapi.doCreatePPQR(netAmount, shopid).then(function(qrLink){
								lineconnector.pushImage(userId, botToken, qrLink, qrLink).then(function(code){
									var qrUseText = "คุณสามารถใช้แอพลิเคชั่นจำพวกโมบายแบงค์กิ้งในโทรศัพท์มือของคุณสแกนคิวอาร์โค้ดด้านบนเพื่อชำระเงินได้ทันที\nหากต้องการใช้บริการอื่นๆ เชิญเลือกได้จากเมนูครับ";
									lineconnector.pushPostBack(userId, botToken, lineconnector.createBotMenu(qrUseText, libapi.mainmenu)); 
									res.status(200).send({code: 200});
								});
							});
						});
					}
				});
			});
		});
	});
});

app.post('/billclosed/(:userId)', function(req, res) {
	var userId = req.params.userId;
	libapi.doGetSession(userId, "tempPaytype").then(function(tempPaytype){
		if(tempPaytype){
			res.status(200).send({code: tempPaytype});
		} else {
			res.status(200).send({code: 0});
		}
	});
});

app.post('/saveorder/(:userId)/(:shopid)', function(req, res) {
	var userId = req.params.userId;
	var shopid = req.params.shopid;
	var total = req.body.total;
	var payAmount = req.body.payAmount;
	libapi.doGetSession(userId, "tempPaytype").then(function(tempPaytype){
		dbman.doLoadUserid(userId).then(function(uRow){
			libapi.doGetSession(userId, "tempOrder").then(function(result){
				libapi.doGetSession(userId, "tempDiscount").then(function(discount){
					libapi.doGetSession(userId, "tempTelno").then(function(telno){
						libapi.doGetSession(userId, "tempOrderType").then(function(type){
							libapi.doGetSession(userId, "tempOrderOption").then(function(option){
								var orders = JSON.parse(result);
								var orderData = {shopid: shopid, userid: uRow[0].uid, telno: telno, type: type, option: option, discount: discount, items: orders};
								dbman.doSaveOrderDB(orderData).then(function(idRow){
									res.status(200).send({id: idRow[0].id});
								});
							});
						});
					});
				});
			});
		});
	});
});

app.post('/createbill/(:userId)/(:shopid)/(:destination)', function(req, res) {
	var userId = req.params.userId;
	var shopid = req.params.shopid;
	var destination = req.params.destination;
	var total = req.body.total;
	var payamount = req.body.payAmount;
	var orderid = req.body.orderid;
	libapi.doGetTokenBot(destination).then(function(botToken) {
		libapi.doGetSession(userId, "tempPaytype").then(function(paytype){
			dbman.doLoadLastOrderNo(shopid).then(function(lonoRow) {
				var lono = Number(lonoRow[0].lono)
				var nextOrderNo;
				if(Number(lono) > 0) {
					nextOrderNo = myModule.fullSeqNo(lono+1);
				} else {
					nextOrderNo = "0000000001";
				}	
				var billData = {orderid: orderid, orderno: nextOrderNo, paytype: paytype, payamount: payamount};
				dbman.doAddNewBill(billData).then(function(newBillRow) {
					var billid = newBillRow[0].id;
					lineconnector.getUserProfile(userId, botToken).then(function(userdata) {
						var userProfile = JSON.parse(userdata);
						var displayName = userProfile.displayName;
						libapi.doRenderBill(orderid, billid, total, payamount, displayName).then(function(billLink) {
							lineconnector.pushImage(userId, botToken, billLink, billLink).then(function(code){
								var billUseText = "นั่นคือใบเสร็จรับเงิน\nทางร้านขอกราบขอบพระคุณเป็นอย่างสูง หวังว่าโอกาสหน้าเราจะได้รับใช้คุณอีกนะครับ\nหากต้องการใช้บริการอื่นๆ เชิญเลือกได้จากเมนูครับ";
								lineconnector.pushPostBack(userId, botToken, lineconnector.createBotMenu(billUseText, libapi.mainmenu)); 
								res.status(200).send(billLink);
							});
						});
					});
				});
			});
		});
	});
});

app.post('/postfoodreview/(:foodid)', function(req, res) {
	var foodid = req.params.foodid;
	var userId = req.body.userId;
	var destination = req.body.destination;
	//console.log(colors.blue("destination : ") + colors.yellow(destination));
	libapi.doGetTokenBot(destination).then(function(botToken) {
		dbman.doGetMenu(foodid).then(function(foodRow) {
			lineconnector.getUserProfile(userId, botToken).then(function(userdata) {
				var userProfile = JSON.parse(userdata);
				var displayName = userProfile.displayName;
				var pictureUrl = userProfile.pictureUrl;
				var msg  = "มีรีวิวสินค้า " + foodRow[0].name + " เข้ามา โดยลูกค้าชื่อ " + displayName + "\nและมีรูปโปรไฟล์ดังในรูป\nโปรดพิจารณาอนุมัติด้วยเถอะครับ";
				libapi.doSendMessageAdminShop(destination, botToken, msg, pictureUrl, foodRow[0].shopid).then(function(stscode1) {
					libapi.doOpenLiffBOF(userId, botToken, foodRow[0].shopid).then(function(stscode2) {
						libapi.doUpdateSession(userId, "tempMode", "normal");
						res.status(200).send({code: 200});
					});
				});
			});
		});
	});
});

app.post('/postshopreview/(:shopid)', function(req, res) {
	var shopid = req.params.shopid;
	var userId = req.body.userId;
	var destination = req.body.destination;
	//console.log(colors.blue("destination : ") + colors.yellow(destination));
	libapi.doGetTokenBot(destination).then(function(botToken) {
		lineconnector.getUserProfile(userId, botToken).then(function(userdata) {
			var userProfile = JSON.parse(userdata);
			var displayName = userProfile.displayName;
			var pictureUrl = userProfile.pictureUrl;
			var msg  = "มีรีวิวร้านเข้ามา โดยลูกค้าชื่อ " + displayName + "\nและมีรูปโปรไฟล์ดังในรูป\nโปรดพิจารณาอนุมัติด้วยเถอะครับ";
			libapi.doSendMessageAdminShop(destination, botToken, msg, pictureUrl, shopid).then(function(stscode1) {
				libapi.doOpenLiffBOF(userId, botToken, shopid).then(function(stscode2) {
					res.status(200).send({code: 200});
				});
			});
		});
	});
});

app.post('/sendmsg/to', (req, res) => {
	var lpsid = req.body.lpsid;
	var msgText = req.body.msg;
	var destination = req.body.destination;
	var isSendMenu = req.body.isSendMenu;
	//console.log(colors.blue("isSendMenu : ") + colors.yellow(isSendMenu));
	libapi.doGetTokenBot(destination).then(function(botToken) {
		lineconnector.pushMessage(lpsid, botToken, msgText).then(function(pushStatus){
			if(isSendMenu == 'true'){
				//lineconnector.pushPostBack(lpsid, lineconnector.createBotMenu(msgText, libapi.mainmenu));
				lineconnector.pushPostBack(lpsid, botToken, lineconnector.createBotMenu('ร้านของเรายินดีให้บริการ สามารถใช้บริการต่างๆ ได้ทางเมนูนะครับ', libapi.mainmenu));
					/* Clear Session */
				//sessionHolders.del("\"" + lpsid + "\"");
				libapi.doUpdateSession(lpsid, "tempMode", "normal");
			}
			res.status(200).send(pushStatus);
		});
	});
});

app.post('/userprofile/(:userId)', function(req, res) {
	var userId = req.params.userId;
	var destination = req.body.destination;
	libapi.doGetTokenBot(destination).then(function(botToken) {
		lineconnector.getUserProfile(userId, botToken).then(function(userdata) {
			var userProfile = JSON.parse(userdata);
			var displayName = userProfile.displayName;
			var pictureUrl = userProfile.pictureUrl;
			//console.log('userProfile : ', JSON.stringify(userProfile));
			res.status(200).send({displayName: displayName, pictureUrl: pictureUrl});
		});
	});
});

app.post('/checkin/(:userId)', function(req, res) {
	var userId = req.params.userId;
	var dinid = req.body.dinid;
	libapi.doUpdateSession(userId, "tempOrderOption", "1");
	libapi.doUpdateSession(userId, "tempDinid", dinid);
	res.status(200).send({code: 200});
});

app.post('/updateitemamount/(:userId)', function(req, res) {
	var userId = req.params.userId;
	var itemid = req.body.itemid;
	var amount = req.body.amount;
	var newAmount = req.body.newAmount;
	libapi.doGetSession(userId, "tempOrder").then(function(result){
		var orders = JSON.parse(result);
		orders.forEach(function(item){
			if((item.itemid == itemid) && (item.amount == amount)) {
				item.amount = newAmount;
			}
		});
		libapi.doUpdateSession(userId, "tempOrder", JSON.stringify(orders));
		res.status(200).send({code: 200});
	});
});

app.post('/updateitemprice/(:userId)', function(req, res) {
	var userId = req.params.userId;
	var itemid = req.body.itemid;
	var amount = req.body.amount;
	var newItemPrice = req.body.newItemPrice;
	libapi.doGetSession(userId, "tempOrder").then(function(result){
		var orders = JSON.parse(result);
		orders.forEach(function(item){
			if((item.itemid == itemid) && (item.amount == amount)) {
				item.itemprice = newItemPrice;
			}
		});
		libapi.doUpdateSession(userId, "tempOrder", JSON.stringify(orders));
		res.status(200).send({code: 200});
	});
});

app.post('/orderitemqty/(:userId)', function(req, res) {
	var userId = req.params.userId;
	libapi.doGetSession(userId, "tempOrder").then(function(result){
		var orders = JSON.parse(result);
		res.status(200).send({qty: orders.length});
	});
});

app.post('/additemtrigger/(:userId)', function(req, res) {
	var userId = req.params.userId;
	var destination = req.body.destination;
	var itemText = req.body.itemtext;
	var shopid = req.body.shopid;
	//console.log(colors.blue("destination : ") + colors.yellow(destination));
	libapi.doGetTokenBot(destination).then(function(botToken) {
		lineconnector.getUserProfile(userId, botToken).then(function(userdata) {
			var userProfile = JSON.parse(userdata);
			var displayName = userProfile.displayName;
			var pictureUrl = userProfile.pictureUrl;
			var msg  = "มีออเดอร์ของลูกค้าเพิ่มเข้ามา\n" + itemText +"\nเป็นของลูกค้าชื่อ " + displayName + "\nและมีรูปโปรไฟล์ดังในรูป\nโปรดตรวจเช็คด้วยครับ";
			libapi.doSendMessageAdminShop(destination, botToken, msg, pictureUrl, shopid).then(function(stscode1) {
				libapi.doOpenLiffBOF(userId, botToken, shopid).then(function(stscode2) {
					res.status(200).send({code: 200});
				});
			});
		});
	});
});

app.post('/updatetemptelno/(:userId)', function(req, res) {
	var userId = req.params.userId;
	var telno = req.body.telno;
	libapi.doUpdateSession(userId, "tempTelno", telno);
	libapi.doUpdateSession(userId, "tempOrderType", 0);
	libapi.doUpdateSession(userId, "tempOrderOption", 0);
	libapi.doUpdateSession(userId, "tempDiscount", 0);
	res.status(200).send({code: 200});
});


/* Export App Module */
module.exports = app;