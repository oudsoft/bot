//webhookapi.js
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
const redis = require('redis');
const sessionHolders = redis.createClient(); 
const app = express();

const db = require('./pgpool.js');
const pool = db.getPool();

const lineconnector = require("./lineapiconnect.js");
const dbman = require("./dbmanager.js");
const myModule = require("./myModule.js");
const logger = require('./logger');

/*****************************************************************/
/* API_CONST */
const MAIN_MENU = [{id: 'x101', name: 'รายการสินค้า'}, {id: 'x102', name: 'ตะกร้าสินค้า'}, {id: 'x103', name: 'แจ้งชำระเงิน'}, {id: 'x104', name: 'รายละเอียดร้าน'}, {id: 'x105', name: 'วิธีใช้งาน'}, {id: 'x106', name: 'ร้องเรียนปัญหา'}];
exports.mainmenu = MAIN_MENU;
const BACK_MENU = [{id: 'x201', name: 'กลับ'}];
exports.backmenu = BACK_MENU;
const OTHER_MENU = [{id: 'x301', name: 'เลือกอย่างอื่นเพิ่ม'}, {id: 'x302', name: 'สั่งออเดอร์'}, {id: 'x303', name: 'กลับ'}];
exports.othermenu = OTHER_MENU;
const ORDER_TYPE_MENU = [{id: 'x401', name: 'ส่งของแล้วเก็บเงิน'}, {id: 'x402', name: 'ส่งทางไปรษณีย์'}];
exports.ordertypemenu = ORDER_TYPE_MENU;

/*********************************************/
/* Manage Session */
sessionHolders.on('connect', function(data) {
    console.log(colors.green('Redis client connected'));
});

sessionHolders.on('error', function (err) {
    console.log(colors.red('Something went wrong on Redis ' + err));
});

function updateSession(key, field, value){
	sessionHolders.hset("\"" + key + "\"", field, value);	
}
exports.doUpdateSession = updateSession;

function getSession(key, field){
	return new Promise(function(resolve, reject) {
		sessionHolders.hget("\"" + key + "\"", field, function (error, value) {	
			if (error) {	
				console.log(error); reject(error);	
			} else {
				//console.log('GET result ->' + colors.yellow(value));
				resolve(value);
			}
		});
	});
}
exports.doGetSession = getSession;

function deleteSession(key){
	return new Promise(function(resolve, reject) {
		sessionHolders.del("\"" + key + "\"");	
		resolve({code: 'OK'});
	});
}
exports.doDeleteSession = deleteSession;


function deleteSessionField(key, field){
	return new Promise(function(resolve, reject) {
		sessionHolders.del("\"" + key + "\"", field);
		resolve({code: 200});		
	});
}
exports.doDeleteSessionField = deleteSessionField;

function getTokenBot(destination) {
	return new Promise(function(resolve, reject) {
		getSession(destination, "token").then(function(botToken){
			//console.log("destination :: " + colors.yellow(destination));
			if(botToken) {
				resolve(botToken);
			} else {
				dbman.loadToken(destination).then(function(botToken){
					updateSession(destination, "token", botToken[0].token);
					updateSession(destination, "shopid", botToken[0].shopid);
					resolve(botToken[0].token);
				});
			}
		});

	});
}
exports.doGetTokenBot = getTokenBot;

/*****************************************************************/
/* API_METHOD */

/* handle message type text section */
exports.textMessageHandle = function (userId, replyToken, userText, req, res){
	var destination = req.body.destination;
	var question, intro;
	getTokenBot(destination).then(function(botToken) {
		//console.log(colors.blue("botToken : ") + colors.yellow(JSON.stringify(botToken)));
		getSession(userId, "tempMode").then(function(userMode) {
			/* short cut ignore mode */
			console.log(colors.blue("userText : ") + colors.yellow(userText));
			if ((userText.toUpperCase() === "PHAMA")  || (userText === "close") || (userText === "ยา")){
				var intro = "โปรดเลือกทำรายการจากเมนูได้เลยครับ";
				lineconnector.replyPostBack(replyToken, botToken, lineconnector.createBotMenu(intro, MAIN_MENU));
				//sessionHolders.del("\"" + userId + "\"");
				updateSession(userId, "tempMode", "normal");
			} else if ((userText.toUpperCase() === "ADMIN") || (userText.toUpperCase() === "AD")) {
				//shop admin short cut command
				/* Please Check Role First */
				getSession(destination, "shopid").then(function(shopid){
					doOpenLiffBOF(userId, botToken, shopid);
				});
				/* Please Check Role First */
			} else if (userText.toUpperCase() === "HELLO, WORLD") {
				//In this case, for webhook verify by LINE API
				res.status(200).send("OK");
			}

			if (userMode=="normal") {
				//doReturnUnkhownCommand(userId, replyToken, botToken, destination, userText);
			} else if (userMode=="amount") {
				if ((!isNaN(userText)) && (Number(userText) > 0)) {
					getSession(userId, "tempItem").then(function(fitemid){
						getSession(userId, "tempName").then(function(itemname){
							getSession(userId, "tempPrice").then(function(itemprice){
								getSession(userId, "tempUnit").then(function(itemunit){
									getSession(userId, "tempGtype").then(function(gtype){
										var newOrder = {itemid: fitemid, amount: userText, itemname: itemname, itemprice: itemprice, itemunit: itemunit, itemstatus: 1, gtype: gtype};
										getSession(userId, "tempOrder").then(function(result){
											var orders;
											if(result) {
												orders = JSON.parse(result);
												orders.push(newOrder);
											} else {
												orders = [newOrder];
											}
											updateSession(userId, "tempOrder", JSON.stringify(orders));
											var intro = "เลือกทำรายการต่อ จากเมนู หากต้องการส่งรายการที่สั่งแล้วทั้งหมดไปให้ทางร้าน เลือก สั่งออร์เดอร์ (ปุ่มกลาง)";
											lineconnector.pushPostBack(userId, botToken, lineconnector.createBotMenu(intro, OTHER_MENU)).then(function(code){
												updateSession(userId, "tempMode", "normal");							
											});
										});
									});
								});
							});
						});
					});
				} else {
					getSession(userId, "tempItem").then(function(fitemid){
						dbman.doGetMenu(fitemid).then(function(row){
							var msg = "กรุณาพิมพ์ตัวเลขเพื่อบอกจำนวน " + row[0].unit + " ที่ต้องการสั่งด้วยครับ\n(พิมพ์ 0 ก็ไม่ได้นะครับ)"
							lineconnector.replyMessage(replyToken, botToken, msg).then(function(code) {
								// change input mode for amount item
								updateSession(userId, "tempMode", "amount");
							});
						});
					});
				}
			} else if (userMode=="telno") {
				var telnoMod = userText.trim();
				if((telnoMod.length === 10) && (Number(telnoMod)  > 0) && (telnoMod.charAt(0)==='0')){
					//update telno
					/*ให้ไปค้นหาข้อมูลจาก DB มาก่อน ถ้าพบให้เอามายืนยันใหม่ ถ้าไม่พบค่อยให้ user กรอกเข้ามาใหม่*/
					updateSession(userId, "tempTelno", telnoMod);
					getSession(userId, "tempOrderType").then(function(ordertype){
						if(ordertype == "1"){
							//ส่งของแล้วเก็บเงิน
							//บันทึกออเดอร์ + ขอบคุณลูกค้า + pushMessage ไปแจ้งออร์เดอร์กับ shopAdmin
							doSaveOrder(userId, replyToken, botToken, destination);
						} else if(ordertype == "2"){
							var msg = "โปรดป้อนชื่อ-นามสกุล ผู้รับสินค้า ด้วยครับ\n(ชื่อ..........นามสกุล...........)";
							lineconnector.replyMessage(replyToken, botToken, msg).then(function(code) {
								// change input mode for custname
								updateSession(userId, "tempMode", "custname");
							});
						}
          });
				} else {
					lineconnector.pushMessage(userId, botToken, "คุณป้อนเบอร์โทรศัพท์ไม่ถูกต้องครับ โปรดป้อนใหม่อีกครั้งในรูปแบบดังนี้ครับ\n0xxxxxxxxx")
					updateSession(userId, "tempMode", "telno");
				}
			} else if (userMode=="custname") {
				updateSession(userId, "tempCustName", userText);				
				var msg = "โปรดป้อนที่อยู่ผู้รับสินค้า (" + userText + ") เพื่อให้ทางร้านจัดส่งสินค้าไปให้ด้วยครับ\n(่เลขที่.... หมู่ที่.... ตรอก/ซอย.....ถนน.... ตำบล/แขวง.... อำเภอ/เขต..... จังหวัด...... รหัสไปรษณีย์......)";
				lineconnector.replyMessage(replyToken, botToken, msg).then(function(code) {
					// change input mode for address
					updateSession(userId, "tempMode", "address");
				});
			} else if (userMode=="address") {
				updateSession(userId, "tempCustAddress", userText);
				doSaveOrder(userId, replyToken, botToken, destination);
			} else if (userMode=="postcode") {
				var postCode = userText.trim();
				if((postCode.length === 5) && (Number(postCode)  > 0)){	
					/* ให้ user ป้อนรหัสไปรษณีย์ เพื่อค้นหา ตำบล อำเภอ จังหวัด ให้ลูกค้าไปเลือกใน liff พร้อมทั้งไปกรอก เลขที่(บ้าน) หมู่ที่ ถนน ตรอก ซอย และ เบอร์โทร
					--select districts.id, districts.name_th, amphures.name_th, provinces.name_th from provinces, amphures, districts 
					--where provinces.id=amphures.province_id and districts.amphure_id = amphures.id and districts.zip_code='80160'
					--select count(districts.id) from provinces, amphures, districts 
					--where provinces.id=amphures.province_id and districts.amphure_id = amphures.id and districts.zip_code='80160'
					--select districts.id, districts.name_th, amphures.name_th, provinces.name_th from provinces, amphures, districts 
					--where provinces.id=amphures.province_id and districts.amphure_id = amphures.id and districts.zip_code='80160' offset 0 limit 10
					--select districts.id, districts.name_th, amphures.name_th, provinces.name_th from provinces, amphures, districts 
					--where provinces.id=amphures.province_id and districts.amphure_id = amphures.id and districts.zip_code='80160' offset 10 limit 10
					*/
				} else {
					lineconnector.pushMessage(userId, botToken, "คุณป้อนรหัสไปรษณีย์ไม่ถูกต้องครับ โปรดป้อนใหม่อีกครั้งในรูปแบบตัวเลข 5 หลัก")
					updateSession(userId, "tempMode", "postcode");
				}
			} else {
				doReturnUnkhownCommand(userId, replyToken, botToken, destination, userText);
			}
		});
	});
}

/* handle message type image section */
exports.imageMessageHandle = function (userId, replyToken, destination, imageId){
	getSession(destination, "shopid").then(function(shopid){
		getTokenBot(destination).then(function(botToken) {
			const imageFileExName = '.jpg';
			var imagePath =  parentDir + '/resource/img/' + constlib.USER_UPLOAD_FOLDER + '/' + imageId + imageFileExName;
			var rawFilename = parentDir + '/log/rawtext/' +  imageId + '.txt';
			lineconnector.saveUserImagePost(imageId, imagePath).then(function (localFile) {
				//console.log(colors.blue("Your Customer LocalFile : ") + colors.green(localFile));
				var slipLink = "http://www.myshopman.com/phama/" + constlib.USER_UPLOAD_FOLDER + '/'  + imageId + imageFileExName;
				updateSession(userId, "tempSlipLink", slipLink);
				var msg = 'รอสักครู่นะครับ ขอตรวจสอบแป๊ปหนึ่ง\nระหว่างที่รอผลการตรวจยอดชำระเงิน คุณสามารถใช้บริการอื่นๆ ได้จากเมนูครับ';
				var botmenu = lineconnector.createBotMenu(msg, MAIN_MENU);
				lineconnector.replyPostBack(replyToken, botToken, botmenu).then(function(stscode) {
					dbman.doLoadAdminShop(shopid).then(function(adminRows) {
						adminRows.forEach((item)=>{
							var adminLpsid = item.lpsid;
							doAlertAdminVerifySlip(botToken, adminLpsid, userId, slipLink).then(function(alertStatus) { });
						});

						/*
						doAlertSupperUserVerifySlip(pendingSel, imageId).then(function(alertStatus) {});
						*/


					});
					updateSession(userId, "tempMode", "normal");
				});
			});
		});
	});
}

/* handle postback message section */
exports.postbackMessageHandle = function (userId, replyToken, cmds, req){
	var action = cmds[0].split("=");
	let itemid = cmds[1].split("=");
	var data = cmds[2].split("=");
	var destination = req.body.destination;
	console.log(colors.blue("cmds[0] : ") + colors.yellow(cmds[0]));
	console.log(colors.blue("cmds[1] : ") + colors.yellow(cmds[1]));
	console.log(colors.blue("data : ") + colors.yellow(data));
	console.log(colors.blue("destination : ") + colors.yellow(destination));
	console.log(colors.blue("itemid[1] : ") + colors.yellow(itemid[1]));
	getTokenBot(destination).then(function(botToken) {
		if (action[1]=='sel') {
			var xx = req.body.events[0].postback.data.split("&");
			var yy = xx[1].split("=");
			var zz = xx[2].split("=");
			var shopid = zz[1];
			var fitemid = yy[1];

			if ((data[1]=='x101') || (data[1]=='x201') || (data[1]=='x303')) {
				//เมนูอาหาร
				getSession(destination, "shopid").then(function(shopid){
					dbman.doLoadGroupMenu(shopid).then(function(menuRows) {
						doCreateMainMenuCarousel(userId, replyToken, botToken, menuRows, shopid).then(function(tt) {
							var intro = "เลือกเมนูอาหารได้จากหมวดเมนูด้านบน หรือหากต้องการใช้บริการอื่นๆ สามารถทำได้โดยคลิกปุ่มต่างๆ ด้านล่าง";
							lineconnector.pushPostBack(userId, botToken, lineconnector.createBotMenu(intro, MAIN_MENU));
						});
					});
				});
			} else if (data[1]=='x102') {
				//ตะกร้าสินค้า
				getSession(userId, "tempOrder").then(function(result){
					//console.log('tempOrder : ', JSON.stringify(result));
					if (result) {
						var sumText = "ยอดรวมค่าสินค้าทั้งหมดของคุณ มีดังนี้\n"
						doCheckBillText(userId, function(sText){
							//getSession(userId, "tempDiscount").then(function(discount){
								var dText = sText;
								/*
								if(Number(discount) == 0){
									dText = sText.concat("\n(หมายเหตุ ค่าอาหารจริงๆทั้งหมด อาจน้อยกว่านี้ เนื่องจากขณะนี้ทางร้านยังไม่ได้กำหนดส่วนลดให้แก่คุณ\nคุณสามารถติดต่อขอรับบิลของจริงได้จากทางร้านครับ)");
									dText = dText.concat("\nหากต้องการใช้บริการอื่นๆ ขอเชิญเลือกได้จากเมนูด้านล่างครับ");
								}
								*/
								sumText = sumText.concat(dText);
								/* ของจริงต้องส่ง message ไปให้ adminShop ยืนยันความถูกต้องของค่าใช้จ่ายทั้งหมดอีกที โดยให้ user confirm ว่าจะเอาของบิลจริงจากร้านเลยหรือไม่*/
								var botmenu = lineconnector.createBotMenu(sumText, MAIN_MENU);
								lineconnector.replyPostBack(replyToken, botToken, botmenu); 
							//});
						});
					} else {
						getSession(destination, "shopid").then(function(shopid){
							dbman.doLoadGroupMenu(shopid).then(function(menuRows) {
								doCreateMainMenuCarousel(userId, replyToken, botToken, menuRows, shopid).then(function(tt) {
									var intro = "คุณยังไม่มีออเดอร์ให้เช็คบิลในขณะนี้ คุณต้องสร้างออเดอร์ใหม่เสียก่อน โดยเลือกเมนูอาหารได้จากหมวดเมนูด้านบน หรือหากต้องการใช้บริการอื่นๆ สามารถทำได้โดยคลิกปุ่มต่างๆ ด้านล่าง";
									lineconnector.pushPostBack(userId, botToken, lineconnector.createBotMenu(intro, MAIN_MENU));
								});
							});
						});
					}
				});
			} else if (data[1]=='x103') {
				//แจ้งชำระเงิน
				getSession(userId, "tempOrder").then(function(result){
					if(result.length > 0){
						var msg = "โปรดโพสต์สลิปหลักฐานการชไระเงินส่งเข้าเลยครับ"
						lineconnector.replyMessage(replyToken, botToken, msg).then(function(stscode) {
							updateSession(userId, "tempMode", "postslip");
						});
					} else {
						var intro = "คุณยังไม่มีออเดอร์สำหรับการแจ้งชำระเงินในขณะนี้\nโปรดเริ่มสั่งสินค้าก่อนเลยครับ";
						var botmenu = lineconnector.createBotMenu(intro, MAIN_MENU);
						lineconnector.replyPostBack = (replyToken, botToken, botmenu).then(function(stscode) {	
							updateSession(userId, "tempMode", "normal");
						});
					}
				});
			} else if (data[1]=='x104') {
				//รายละเอียดร้าน
				getSession(destination, "shopid").then(function(shopid){
					dbman.doLoadLIFFShopReview(shopid).then(function(revRows){
						var reviewlink = revRows[0].liff_rev + "?shopid=" + shopid  + "&userId=" + userId  + "&dest=" + destination;
						var label = "เปิดอ่านรายละเอียดร้าน";
						var flex = lineconnector.createBubbleFlexUri(label, reviewlink, '02');
						//console.log(colors.blue("createBubble : ") + colors.yellow(JSON.stringify(bubble)));
						lineconnector.replyPostBack(replyToken, botToken, flex).then(function(pushStatus1) {
							var intro = "เปิดอ่านรายละเอียดร้านได้จากลิงค์ด้านบน หรือเลือกทำรายการอย่างอิ่นจากเมนูด้านล่างนี้ได้เลยครับ";
							lineconnector.pushPostBack(userId, botToken, lineconnector.createBotMenu(intro, MAIN_MENU));
							updateSession(userId, "tempMode", "normal");
						});
					});
				});
			} else if (data[1]=='x105') {
				//วิธีใช้งาน
				var hid = "h00";
				var helper = require('../res/doc/json/userhelp.json');
				//console.log("helper[h00] : " + colors.yellow(helper[hid]));
				var userHelpText = helper[hid];
				var msg = "นั่นคือวิธีใช้งานตามที่คุณขอมาครับ\nหากมีอะไรให้ช่วยอีก คุณสั่งมาได้จากเมนูด้านล่างนะครับ"
				lineconnector.replyMessage(replyToken, botToken, userHelpText).then(function(code) {
					lineconnector.pushPostBack(userId, botToken, lineconnector.createBotMenu(msg, MAIN_MENU));
				});
			} else if (data[1]=='x106') {
				//ร้องเรียนปัญหา
				getSession(destination, "shopid").then(function(shopid){
					dbman.doLoadLIFFShopReview(shopid).then(function(revRows){
						var reviewlink = revRows[0].liff_rev + "?shopid=" + shopid  + "&userId=" + userId  + "&dest=" + destination;
						var label = "รายละเอียดร้าน";
						var flex = lineconnector.createBubbleFlexUri(label, reviewlink, '02');
						//console.log(colors.blue("createBubble : ") + colors.yellow(JSON.stringify(bubble)));
						lineconnector.replyPostBack(replyToken, botToken, flex).then(function(pushStatus1) {
							var hid = "h01";
							var helper = require('../res/doc/json/userhelp.json');
							//console.log("helper[h01] : " + colors.yellow(helper[hid]));
							var userHelpText = helper[hid];
							var msg = "นั่นคือวิธีร้องเรียนปัญหาตามที่คุณขอมาครับ\nหากมีอะไรให้ช่วยอีก คุณสั่งมาได้จากเมนูด้านล่างนะครับ"
							lineconnector.replyMessage(replyToken, botToken, userHelpText).then(function(code) {
								lineconnector.pushPostBack(userId, botToken, lineconnector.createBotMenu(msg, MAIN_MENU));
							});
						});
					});
				});
			} else if (data[1]=='x301') {
				//เลือกเมนูเพิ่ม
				getSession(userId, "tempGroup").then(function(groupid){
					doOpenGroupMenu(userId, replyToken, botToken, groupid, destination);
				});
			} else if (data[1]=='x302') {
				//สั่งออเดอร์ -> สรุปออเดอร์ -> คอนเฟิร์มออเดอร์
				var sumText = "รายการสินค้าที่คุณสั่งมีดังนี้\n"
				doSummaryOrderText(userId, function(sText) {
					var dText = sText.concat("\nยืนยันการสั่งออเดอร์นี้ โดยเลือก ตกลง หรือ ปฏิเสธโดยเลือก ยกเลิก\n(ในกรณียกเลิกสินค้าทั้งหมดในตะกร้าจะถูกลบทิ้ง)");
					sumText = sumText.concat(dText);
					lineconnector.replyPostBack(replyToken, botToken, lineconnector.createConfirmCurrect(sumText, yy[1], "21", "ตกลง", "ตกลง", "22", "ยกเลิก", "ยกเลิก")); 
				});
			} else if (data[1]=='21') {
				getSession(userId, "tempGtype").then(function(gtype){
					if(gtype == "prod") {
						var intro = "...";
						lineconnector.replyPostBack(replyToken, botToken, lineconnector.createBotMenu(intro, ORDER_TYPE_MENU));
					} else if (gtype == "onli") {
						var intro = "โปรดเลือกว่าจะให้ทางร้านจัดส่งสินค้าไปให้คุณแบบไหนดีครับ\nส่งของแล้วเก็บเงิน หรือ ส่งทางไปรษณีย์";
						lineconnector.replyPostBack(replyToken, botToken, lineconnector.createBotMenu(intro, ORDER_TYPE_MENU));
					}
				});
			} else if (data[1]=='22') {
				//ปฏิเสธโดยเลือก ยกเลิก ออเดอร์
				//ลบ tempOrder
				deleteSessionField(userId, "tempOrder");
				deleteSessionField(userId, "tempGroup");
				deleteSessionField(userId, "tempItem");
				var msg = "ขอขอบคุณที่สละเวลามาเลือกชมรายการสินค้าของเราครับ โอกาสหน้าเราคงจะได้รับใช้คุณ ขอเชิญเลือกใช้บริการอื่นๆ จากเมนูครับ";
				lineconnector.replyPostBack(replyToken, botToken, lineconnector.createBotMenu(msg, MAIN_MENU));
			} else if (data[1]=='x401') {
				//ส่งของแล้วเก็บเงิน
				updateSession(userId, "tempOrderType", "1");
				dbman.doLoadUserid(userId).then(function(uRow) {
					dbman.doLoadCustomer(uRow[0].id).then(function(custRow) {
						if (custRow.length == 0) {
							var intro = "โปรดป้อนเบอร์โทรศัพท์ของคุณเพื่อให้ทางร้านติดต่อกลับไปคอนเฟิร์มออเดอร์อีกครั้งครับ";
							lineconnector.replyMessage(replyToken, botToken, msg).then(function(code) {
								// change input mode for amount item
								updateSession(userId, "tempMode", "telno");
							});
						} else {
							var lastCustData = custRow[custRow.length-1];
							var msg = 'ข้อมูลจัดส่งสินค้าครั้งล่าสุดของคุณคือ\n';
							msg =  msg + 'ชื่อ-นามสกุล ' + lastCustData.custname + '\n';
							msg =  msg + 'ที่อยู่ ' + lastCustData.custaddress + '\n';
							msg =  msg + 'โทรศัพท์ ' + lastCustData.custtelno + '\n';
							msg =  msg + 'คุณต้องการใช้ข้อมูลนี้สำหรับจัดส่งสินค้าในครั้งนี้หรือไม่?'
							var confirmmenu = lineconnector.createConfirmCurrect(msg, "00", "81", "ใช่", "ใช่", "82", "ไม่ใช่", "ไม่ใช่");
							lineconnector.replyPostBack(replyToken, botToken, confirmmenu)
						}
					});
				});
			} else if (data[1]=='x402') {
				//ส่งทางไปรษณีย์
				updateSession(userId, "tempOrderType", "1");				
				dbman.doLoadUserid(userId).then(function(uRow) {
					dbman.doLoadCustomer(uRow[0].id).then(function(custRow) {
						if (custRow.length == 0) {				
							var intro = "โปรดป้อนเบอร์โทรศัพท์ของคุณเพื่อให้ทางร้านติดต่อกลับไปคอนเฟิร์มออเดอร์อีกครั้งครับ";
							lineconnector.replyMessage(replyToken, botToken, msg).then(function(code) {
								// change input mode for amount item
								updateSession(userId, "tempMode", "telno");
							});
						} else {
							var lastCustData = custRow[custRow.length-1];
							var msg = 'ข้อมูลจัดส่งสินค้าครั้งล่าสุดของคุณคือ\n';
							msg =  msg + 'ชื่อ-นามสกุล ' + lastCustData.custname + '\n';
							msg =  msg + 'ที่อยู่ ' + lastCustData.custaddress + '\n';
							msg =  msg + 'โทรศัพท์ ' + lastCustData.custtelno + '\n';
							msg =  msg + 'คุณต้องการใช้ข้อมูลนี้สำหรับจัดส่งสินค้าในครั้งนี้หรือไม่?'
							var confirmmenu = lineconnector.createConfirmCurrect(msg, "00", "81", "ใช่", "ใช่", "82", "ไม่ใช่", "ไม่ใช่");
							lineconnector.replyPostBack(replyToken, botToken, confirmmenu)
						}
					});
				});							
			} else if (data[1]=='61') {
				//บันทึกออเดอร์ + ขอบคุณลูกค้า + pushMessage ไปแจ้งออร์เดอร์กับ shopAdmin
				/*
				var dinid = yy[1];
				updateSession(userId, "tempDinid", dinid);
				doSaveOrder(userId, replyToken, botToken, destination);
				*/
			} else if (data[1]=='71') {
				//Verify Slip Pass
				/*1. save tempOrder -> DB and Clear temp
					2. ออกใบเสร็จรับเงิน
					3. จะดำเนินการส่งสินค้าตามเงื่อนไข
						3.1 หลังจากจัดส่งแล้ว ผมจะแจ้งหมายเลขติดตามพัสดุให้ทราบ
				*/
				dumpTemp2DB(userId).then(function(orderid){
					doCheckBillText(userId, function(CBText){
						doCreateBill(userId, destination, orderid, CBText.total).then(function(billLink){
							lineconnector.pushImage(userId, botToken, billLink, billLink).then(function(code){
								var billUseText = "ข้อมูลการชำระเงินถูกต้อง\nและนั่นคือใบเสร็จรับเงินของคุณครับ\nทางร้านขอกราบขอบพระคุณเป็นอย่างสูง หวังว่าโอกาสหน้าเราจะได้รับใช้คุณอีกนะครับ\n";
								billUseText = billUseText + "เมื่อสินค้าตามออเดอร์ของคุณได้จัดส่งเข้าสู่ระบบขนส่งแล้ว เราจะแจ้งหมายเลขติดตามพัสดุให้ทราบในลำดับต่อไป\nหากต้องการใช้บริการอื่นๆ เชิญเลือกได้จากเมนูครับ";
								var botmenu = lineconnector.createBotMenu(intro, MAIN_MENU);
								lineconnector.pushPostBack(userId, botToken, botmenu).then(function(stscode){
									deleteSessionField(userId, "tempOrder");
								});
							});
						});
					});
				});
			} else if (data[1]=='72') {
				//Verify Slip Not Pass
				var msg = 'มีความผิดพลาดเรื่องยอดเงินโอน\nอีกสักครู่จะมีเจ้าหน้าที่จะติดต่อกลับไปครับ';
				lineconnector.replyMessage(replyToken, botToken, msg);
			} else if (data[1]=='81') {
				//ใช้ข้อมูลสถานที่ครั้งล่าสุด
				updateSession(userId, "tempOrderType", "1");				
				dbman.doLoadUserid(userId).then(function(uRow) {
					dbman.doLoadCustomer(uRow[0].id).then(function(custRow) {
						updateSession(userId, "tempTelno", lastCustData.custtelno);	
						updateSession(userId, "tempCustName", lastCustData.custname);				
						updateSession(userId, "tempCustAddress", lastCustData.custaddress);
						doSaveOrder(userId, replyToken, botToken, destination);
					});
				});
			} else if (data[1]=='82') {
				//ป้อนข้อมูลสถานที่ใหม่
				var intro = "โปรดป้อนเบอร์โทรศัพท์ของคุณเพื่อให้ทางร้านติดต่อกลับไปคอนเฟิร์มออเดอร์อีกครั้งครับ";
				lineconnector.replyMessage(replyToken, botToken, msg).then(function(code) {
					// change input mode for amount item
					updateSession(userId, "tempMode", "telno");
				});				
			}
		} else if (action[1]=='open') {
			var xx = req.body.events[0].postback.data.split("&");
			var yy = xx[1].split("=");
			var groupid = yy[1];
			doOpenGroupMenu(userId, replyToken, botToken, groupid, destination);
		} else if (action[1]=='buy') {
			var xx = req.body.events[0].postback.data.split("&");
			var yy = xx[1].split("=");
			var zz = xx[2].split("=");
			var shopid = zz[1];
			var fitemid = yy[1];
			updateSession(userId, "tempItem", fitemid);
			dbman.doGetMenu(fitemid).then(function(row){
				updateSession(userId, "tempName", row[0].name);
				updateSession(userId, "tempUnit", row[0].unit);
				updateSession(userId, "tempPrice", row[0].price);
				updateSession(userId, "tempGtype", row[0].gtype);
				var msg = "พิมพ์ตัวเลขเพื่อบอกจำนวน " + row[0].unit + " ที่ต้องการสั่ง"
				lineconnector.replyMessage(replyToken, botToken, msg).then(function(code) {
					// change input mode for amount item
					updateSession(userId, "tempMode", "amount");
				});
			});
		} else if (action[1]=='view') {
			var xx = req.body.events[0].postback.data.split("&");
			var yy = xx[1].split("=");
			var zz = xx[2].split("=");
			var itemid = yy[1];
			var shopid = zz[1];
			dbman.doLoadLIFFPhamaReview(shopid).then(function(revRows){
				var reviewlink =  revRows[0].liff_phamarev + "?phamaid=" + itemid + "&userId=" + userId + "&dest=" + destination;
				//https://www.myshopman.com/phama/phamareview
				var label = "เปิดอ่านรีวิว";
				var flex = lineconnector.createBubbleFlexUri(label, reviewlink, '02');
				//console.log(colors.blue("createBubble : ") + colors.yellow(JSON.stringify(bubble)));
				lineconnector.replyPostBack(replyToken, botToken, flex).then(function(pushStatus1) {
					var intro = "เปิดอ่านรีวิวได้จากลิงค์ด้านบน หรือเลือกทำรายการอย่างอิ่นต่อจากเมนูด้านล่างนี้ได้เลยครับ";
					lineconnector.pushPostBack(userId, botToken, lineconnector.createBotMenu(intro, MAIN_MENU));
					updateSession(userId, "tempMode", "normal");
				});
			});
		} else if  (action[1]=='close') {
			console.log("All right " + colors.yellow(JSON.stringify("Thank.")));
		}

	});
}

exports.doOpenLiffBOF = function (userId, botToken, shopid) {
	return new Promise(function(resolve, reject) {
		dbman.doLoadLIFFBOF(shopid).then(function(bofRows) {
			var label = "เปิดระบบควบคุม";
			var flex = lineconnector.createBubbleFlexUri(label, bofRows[0].liff_bof, '02');
			//console.log(colors.blue("createBubble : ") + colors.yellow(JSON.stringify(bubble)));
			lineconnector.pushPostBack(userId, botToken, flex).then(function(pushStatus1) {
				var intro = "เปิดระบบควบคุมได้จากลิงค์ด้านบน หรือเลือกทำรายการอย่างอิ่นจากเมนูด้านล่างนี้ได้เลยครับ";
				lineconnector.pushPostBack(userId, botToken, lineconnector.createBotMenu(intro, MAIN_MENU));
				resolve({code: 200});
			});
		});
	});
}


exports.checkBillText = doCheckBillText;
exports.returnUnkhownCommand = doReturnUnkhownCommand;
exports.renderBill = doRenderBill;
exports.createPPQR = doCreatePPQR;
exports.sendMessageAdminShop = doSendMessageAdminShop;
/* Internal Method */

function doCreateMainMenuCarousel(userId, replyToken, botToken, rows, shopid){
	return new Promise(function(resolve, reject) {
		var temp = lineconnector.createCarouselMainMenuTemplate(rows, shopid);
		//console.log(colors.blue("@doCreateGeegeeCarousel : ") + colors.yellow(JSON.stringify(temp)));
		lineconnector.pushPostBack(userId, botToken, temp).then(function(code) {
			resolve(temp);
		});
	});
}

function doCreateMenuBubble(userId, replyToken, botToken, rows, shopid){
	return new Promise(function(resolve, reject) {
		lineconnector.createBubbleMenuTemplate(rows, shopid).then(function(temp) {
			//console.log(colors.blue("@doCreateMenuBubble : ") + colors.yellow(JSON.stringify(temp)));
			lineconnector.pushPostBack(userId, botToken, temp).then(function(code) {
				resolve(temp);
			});
		});
	});
}

function doOpenGroupMenu(userId, replyToken, botToken, groupid, destination){
	updateSession(userId, "tempGroup", groupid);
	dbman.doLoadMenu(groupid).then(function(menuRows) {
		getSession(destination, "shopid").then(function(shopid){
			//console.log("menuRows " + colors.yellow(JSON.stringify(menuRows)));
			doCreateMenuBubble(userId, replyToken, botToken, menuRows, shopid).then(function(tt) {
				var intro = "กลับไปหน้าเมนูหลัก โดยคลิกปุ่ม กลับ ครับ";
				lineconnector.pushPostBack(userId, botToken, lineconnector.createBotMenu(intro, BACK_MENU));
			});
		});
	});
}

function doSummaryOrderText(userId, callback){
	getSession(userId, "tempOrder").then(function(result){
		var promiseList = new Promise(function(resolve,reject){
			var sumText = "";
			var orders = JSON.parse(result);
			//orders.sort((a,b) => (a.itemid > b.itemid) ? 1 : ((b.itemid > a.itemid) ? -1 : 0)); 
			var x = 1;
			orders.forEach((item) => {
				if(item.itemstatus == "1"){
					sumText = sumText.concat((x) + ". " + item.itemname + " = " + item.amount + " " + item.itemunit + "\n");
					x++;
				}
			});
			setTimeout(()=>{
				resolve(sumText);
			},950);
		});
		Promise.all([promiseList]).then((ob)=>{
			callback(ob[0]);
		});
	});
}

function doCheckBillText(userId, callback){
	getSession(userId, "tempOrder").then(function(result){
		getSession(userId, "tempDiscount").then(function(discount){
			getSession(userId, "tempCustStatus").then(function(custStatus){
				var promiseList = new Promise(function(resolve,reject){
					var sumText = "";
					var total = 0;
					var orders = JSON.parse(result);
					//orders.sort((a,b) => (a.itemid > b.itemid) ? 1 : ((b.itemid > a.itemid) ? -1 : 0)); 
					var x = 1;
					var price;
					orders.forEach(function(item, inx){
						if (custStatus == 'normal') {
							price = Number(item.itemprice);
						} else if (custStatus == 'member') {
							price = Number(item.itemexprice);
						}
						if(item.itemstatus != "0") {
							var sumitem =  price * Number(item.amount);
							sumText = sumText.concat((x) + ". " + item.itemname + " จำนวน " + item.amount + " " + item.itemunit + " = " + sumitem + " บาท\n");
							total = total + sumitem;
							x++;
						}
					});
					if(Number(discount) > 0) {
						total = total - Number(discount);
						sumText = sumText.concat("ส่วนลด " + discount + " บาท\n");
					}
					sumText = sumText.concat("รวมทั้งหมด " + total + " บาท");
					setTimeout(()=>{
						resolve({sumText: sumText, total: total});
					},1200);
				});
				Promise.all([promiseList]).then((ob)=>{
					callback(ob[0]);
				});
			});
		});
	});
}

function doSendMessageAdminShop(destination, botToken, msg, pictureUrl, shopid){
	return new Promise(function(resolve, reject) {
		dbman.doLoadAdminShop(shopid).then(function(admRows){
			admRows.forEach(function(item) {
				lineconnector.pushMessage(item.lpsid, botToken, msg).then(function(code) {
					lineconnector.pushImage(item.lpsid, botToken, pictureUrl, pictureUrl);
					resolve({code: 200});
				});
			});
		});
	});
}

function doSaveOrder(userId, replyToken, botToken, destination) {
	getSession(userId, "tempOrderType").then(function(ordertype){
		var msg;
		if(ordertype == "1") {
			//ส่งของแล้วเก็บเงิน
			getSession(userId, "tempTelno").then(function(tempTelno){
				msg = "ขอขอบพระคุณที่ไว้วางใจให้เรารับใช้\nออเดอร์ของคุณมีรายละเอียดดังนี้ครับ\n\n";
				doCheckBillText(userId, function(CBText){
					msg = msg + CBText.sumText + "\n\n";
					msg = msg + "ออเดอร์ที่คุณสั่งจะถูกส่งไปยังร้าน เพื่อให้ทางร้านติดต่อคุณกลับมาทางเบอร์โทรศัพท์ที่คุณให้ไว้ ที่หมายเลข " + tempTelno + "\nโปรดรอคอนเฟิร์มจากทางร้านสักครู่นะครับ หรือเชิญใช้บริการอื่นๆ จากเมนูต่อได้เลยครับ";
					lineconnector.replyPostBack(replyToken, botToken, lineconnector.createBotMenu(msg, MAIN_MENU)).then(function(code) {
						updateSession(userId, "tempMode", "normal");
						updateSession(userId, "tempDiscount", "0");
						lineconnector.getUserProfile(userId, botToken).then(function(userdata) {
							var userProfile = JSON.parse(userdata);
							var displayName = userProfile.displayName;
							var pictureUrl = userProfile.pictureUrl;
							doSummaryOrderText(userId, function(sText){
								msg = "มีออเดอร์ส่งของแล้วเก็บเงินจากลูกค้าเข้ามาใหม่ดังนี้\n";
								doSummaryOrderText(userId, function(sText) {
									msg  = msg.concat(sText);
									msg  = msg.concat("\nโดยลูกค้าชื่อ " + displayName + "\nและรูปโปรไฟล์ลูกค้า ดังในรูป ...");
									doSendMessageAdminShop(destination, botToken, msg, pictureUrl);
								});
							});
						});
					});
				});
			});
		} else if(ordertype == "2") {
			//ส่งทางไปรษณีย์ --> ต้องสร้างหมายเลขออเดอร์ เพื่อใช้อ้างอิงในการแจ้งชำระเงิน
			// 1. scan find tempOrder.length > 0 in sessionHolder
			// 2. if not 1. get last orederNo from DB
			getSession(userId, "tempTelno").then(function(tempTelno){
				getSession(userId, "tempAddress").then(function(tempAddress){
					msg = "ขอขอบพระคุณที่ไว้วางใจให้เรารับใช้\nออเดอร์ของคุณมีรายละเอียดดังนี้ครับ\n\n";
					doCheckBillText(userId, function(CBText){
						msg = msg + CBText.sumText + "\n\n";
						msg = msg + "ออเดอร์ที่คุณสั่งได้ถูกส่งไปที่ร้านเรียบร้อยแล้ว และอยู่ระหว่างรอให้คุณชำระเงิน หากคุณได้ขำระเงินเรียบร้อยแล้วกรุณานำสลับหลักฐานการชำระเงินโพสต์ส่งเข้ามาทางเมนู แจ้งชำระเงิน ที่ช่องทางนี้อีกครั้ง เพื่อให้ทางร้านดำเนินการจัดส่งสินค้าต่อไป\n\n";
						msg = msg + "คุณสามารถชำระเงินงได้่ายๆ โดยใช้โมบายแบงค์กิ้งในโทรศัพท์มือถือสแกน QR โค้ด ด้านล่าง เพื่อจ่ายเงินได้ทันที\nและโปรดอย่าลืมเก็บสลิปมา แจ้งชำระเงิน ด้วยนะครับ";
						lineconnector.replyMessage(replyToken, botToken, msg).then(function(stscode1) {
							getSession(destination, "shopid").then(function(shopid){
								let netAmount = CBText.total;
								doCreatePPQR(netAmount, shopid).then(function(qrLink) {
									lineconnector.pushImage(userId, botToken, qrLink, qrLink).then(function(stscode2){
										updateSession(userId, "tempMode", "normal");
										updateSession(userId, "tempDiscount", "0");
										lineconnector.getUserProfile(userId, botToken).then(function(userdata) {
											var userProfile = JSON.parse(userdata);
											var displayName = userProfile.displayName;
											var pictureUrl = userProfile.pictureUrl;
											msg = "มีออเดอร์ส่งทางไปรษณีย์เข้ามาใหม่จากลูกค้า ดังนี้\n";
											msg = msg + CBText.sumText;
											msg  = msg.concat(sText);
											msg  = msg.concat("\nโดยลูกค้าชื่อ " + displayName + " เบอร์โทรติดต่อ " + tempTelno);
											msg  = msg.concat("\nและรูปโปรไฟล์ลูกค้า ดังในรูป ...");
											doSendMessageAdminShop(destination, botToken, msg, pictureUrl);
										});
									});
								});
							});
						});
					});
				});
			});
		}
	});
}

function doReturnUnkhownCommand(userId, replyToken, botToken, destination, userText){
	var msg = "ผมไม่เข้าใจคำสั่งทีส่งเข้ามาครับ โปรดเลือกทำรายการจากเมนูด้านล่างนี้นะครับ";
	lineconnector.replyPostBack(replyToken, lineconnector.createBotMenu(msg, MAIN_MENU));
	updateSession(userId, "tempMode", "normal");
	logger().info(new Date()  + " >> Unkhown Command From userId>> " + userId + " >> " + userText);
}

function doCreatePPQR(netAmount, shopid){
	return new Promise(function(resolve, reject) {
		dbman.loadPPData(shopid).then(function(row) {
			const PPQRgen = require('../lib/createppqr.js');
			var data = {ppaytype: row[0].ppaytype, ppayno: row[0].ppayno, fname: row[0].fname, lname: row[0].lname};
			PPQRgen.createPPQR(data, netAmount).then(function(qrLink) {
				resolve(qrLink);
			});
		});
	});
}

function doRenderBill(orderid, billid, total, payamount, cutomerName){
	return new Promise(function(resolve, reject) {	
		dbman.loadOrderData(orderid).then(function(orderRow) {	
			dbman.loadBillData(billid).then(function(billRow) {	
				dbman.doLoadShopData(orderRow[0].shopid).then(function(shopRow) {	
					const BillGen = require('../lib/createbill.js');
					BillGen.createBill(orderRow[0], billRow[0], shopRow[0], total, payamount, cutomerName).then(function(billLink) {	
						resolve(billLink);
					});
				});
			});
		});
	});
}

function doAlertAdminVerifySlip(botToken, adminLpsid, userId, slipLink){
	return new Promise(function(resolve, reject) {
		lineconnector.pushImage(adminLpsid, botToken, slipLink, slipLink).then(function(stscode1){
			lineconnector.getUserProfile(userId, botToken).then(function(userdata) {
				var userProfile = JSON.parse(userdata);
				var displayName = userProfile.displayName;
				var pictureUrl = userProfile.pictureUrl;
				doCheckBillText(userId, function(CBText) {
					var msg = 'ลูกค้าชื่อ ' + displayName +'\n';
					msg =  msg + 'ได้แจ้งชำระเงินด้วยสลิปหลักฐานดังในรูปด้านบน\n';
					msg =  msg + 'โดยมีรายละเอียดออเดอร์ดังนี้\n';
					msg =  msg + CBTextsumText + '\n';
					msg =  msg + 'โปรดเช็คยอดเงินที่โอนเข้ามาตรงกับยอดรวมของออเดอร์หรือไม่?'
					var confirmmenu = lineconnector.createConfirmCurrect(msg, "00", "71", "ถูกต้อง", "ถูกต้อง", "72", "ไม่ถูกต้อง", "ไม่ถูกต้อง");
					lineconnector.replyPostBack(replyToken, botToken, confirmmenu).then(function(stscode) {
						resolve({code: 200});
					});
				});
			});
		});
	});
}

function dumpTemp2DB(userId){
	return new Promise(function(resolve, reject) {	
		getSession(userId, "tempPaytype").then(function(tempPaytype){
			dbman.doLoadUserid(userId).then(function(uRow){
				getSession(userId, "tempOrder").then(function(result){
					getSession(userId, "tempDiscount").then(function(discount){
						getSession(userId, "tempTelno").then(function(telno){
							getSession(userId, "tempOrderType").then(function(type){
								getSession(userId, "tempCustName").then(function(custName){
									getSession(userId, "tempCustAddress").then(function(custAddress){								
										var orders = JSON.parse(result);
										var option = "";
										var orderData = {shopid: shopid, userid: uRow[0].uid, telno: telno, type: type, option: option, discount: discount, items: orders, custname: custName, custaddress: custAddress};
										dbman.doSaveOrder(orderData).then(function(idRow){
											resolve(idRow[0].id);
										});
									});
								});
							});
						});
					});
				});
			});
		});	
	});
}

function doCreateBill(userId, destination, orderid, total){
	return new Promise(function(resolve, reject) {		
		getTokenBot(destination).then(function(botToken) {
			getSession(destination, "shopid").then(function(shopid){	
				var orderNo = myModule.fullSeqNo(orderid);
				var paytype = "2"; //Transfer with promptpay
				var payamount = total;
				var billData = {orderid: orderid, orderno: orderNo, paytype: paytype, payamount: payamount};
				dbman.doAddNewBill(billData).then(function(newBillRow) {
					var billid = newBillRow[0].id;
					lineconnector.getUserProfile(userId, botToken).then(function(userdata) {
						var userProfile = JSON.parse(userdata);
						var displayName = userProfile.displayName;
						doRenderBill(orderid, billid, total, payamount, displayName).then(function(billLink) {
							resolve(billLink);
						});
					});
				});
			});
		});	
	});
}

function doRenderBill(orderid, billid, total, payamount, cutomerName){
	return new Promise(function(resolve, reject) {	
		dbman.loadOrderData(orderid).then(function(orderRow) {	
			dbman.loadBillData(billid).then(function(billRow) {	
				dbman.doLoadShopData(orderRow[0].shopid).then(function(shopRow) {	
					dbman.doLoadCustomer(orderRow[0].userid).then(function(custRow){						
						const BillGen = require('./createbill.js');
						BillGen.createBill(orderRow[0], billRow[0], shopRow[0], custRow[0], total, payamount, cutomerName).then(function(billLink) {	
							resolve(billLink);
						});
					});
				});
			});
		});
	});
}


/*
 DB เพิ่มฟิลด์ custname, custtelno, custaddress
ต่อไปต้องทราบให้ได้ว่าลูกค้ามีสถานะเป็น ลูกค้าธรรมดา หรือ สมาชิก เพื่อจะไก้รับสิทธิ์ในการคำนวณราคาที่แตกต่างกัน
  - ตอนนี้ให้เซ็ตสถานะแบบดีฟอลด์ เป็น normal <tempCustStatus='normal/member'>
 - ให้ admin เข้าไปปรับสถานะให้ลูกค้าได้ ในหน้า totalchat
*/