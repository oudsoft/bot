//msgrapiconnect.js
const request = require('request-promise');
const colors = require('colors/safe');
const util = require("util");
const fs = require('fs');
const url = require('url'); 
const path = require("path");
const lineapiconstlib = require("./lineapiconstlib.js");
const constlib = require('./constlib');
const myModule = require("./myModule.js");
const logger = require('./logger');
const config = require('config');

const myshopmanLink = "https://www.myshopman.com/mfood";

exports.callSendAPI = (sender_psid, response) => {
	return new Promise(function(resolve, reject) {
		let request_body = {
			"recipient": {
				"id": sender_psid
			},
			"message": response
		};
		// Send the HTTP request to the Messenger Platform
		request({
			"uri": "https://graph.facebook.com/v3.2/me/messages",
			"qs": { "access_token": config.get('facebook.page.mfoodbot.access_token') },
			"method": "POST",
			"json": request_body
		}, (err, res, body) => {
			if (!err) {			
				logger().info(new Date()  + " >> callSendAPI PSID>> " + sender_psid + " >> " + JSON.stringify(body));
				resolve({code: 200});								
			} else {
				logger().error(new Date()  + " >> callSendAPI PSID>> " + sender_psid + " >> " + JSON.stringify(err));
				resolve({code: 500});	
			}
		});
	});
}

exports.callSendTextAPI = (user_psid, text_toSend) => {
	let getSendTextAPI_uri = "https://graph.facebook.com/v3.2/me/messages?access_token=" + config.get('facebook.page.mfoodbot.access_token');
	return new Promise(function(resolve, reject) {
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
			"qs": { "access_token": config.get('facebook.page.mfoodbot.access_token') },
			"method": "POST",
			"json": request_body
		}, (err, res, body) => {
			if (!err) {			
				logger().info(new Date()  + " >> callSendTextAPI PSID>> " + user_psid + " >> " + JSON.stringify(body));
				resolve({code: 200});								
			} else {
				logger().error(new Date()  + " >> callSendTextAPI  PSID>> " + user_psid + " >> " + JSON.stringify(err));
				resolve({code: 500});	
			}
		});
	});
}

exports.callUserProfileAPI = (user_psid) => {
	return new Promise(function(resolve, reject) {
		let getUserProfile_uri = "https://graph.facebook.com/" + user_psid + "?fields=first_name,last_name,profile_pic&access_token=" + config.get('facebook.page.mfoodbot.access_token');
		request({
			"uri": getUserProfile_uri,
			"method": "GET"
		}, (err, res, body) => {
			if (!err) {			
				resolve(JSON.parse(body));					
			} else {
				reject(err);
			}
		});
	});
}

exports.callSendImageAPI = (user_psid, imageLink) => {
	let getSendImageAPI_uri = "https://graph.facebook.com/v3.2/me/messages?access_token=" + config.get('facebook.page.mfoodbot.access_token');
	return new Promise(function(resolve, reject) {
		let request_body = {
				"recipient":{
					"id":user_psid
				},
				"message":{"attachment":{"type":"image", "payload":{"url":imageLink, "is_reusable":true }}}
		};
		request({
			"uri": getSendImageAPI_uri ,
			"qs": { "access_token": config.get('facebook.page.mfoodbot.access_token') },
			"method": "POST",
			"json": request_body
		}, (err, res, body) => {
			if (!err) {			
				logger().info(new Date()  + " >> callSendImageAPI  PSID>> " + user_psid + " >> " + JSON.stringify(body));
				resolve({code: 200});								
			} else {
				logger().error(new Date()  + " >> callSendImageAPI   PSID>> " + user_psid + " >> " + JSON.stringify(err));
				resolve({code: 500});	
			}
		});
	});
}

/* Call LINE Shop API */
exports.callPostOrderLINEShop  = (data) => {
	return new Promise(function(resolve, reject) {
		const destination = "U77664519abb6c08ae363cc4c22f2083a";
		const callOrederURL = "http://localhost/mfood/webhook/msgrpostorder";
		data.destination = destination;
		request({
			"uri": callOrederURL,
			"method": "POST",
			"json": data
		}, (err, res, body) => {
			if (!err) {			
				logger().info(new Date()  + " >> callPostOrderLINEShop>> " + JSON.stringify(body));
				resolve({code: 200});								
			} else {
				logger().error(new Date()  + " >> callPostOrderLINEShop>> "+ JSON.stringify(err));
				resolve({code: 500});	
			}
		});
	});
}

/* json api connect */

exports.doCreateButtonTemplate = (text, buttons) => {
    return {
        "attachment":{
            "type":"template",
            "payload":{
                "template_type":"button",
                "text": text,
                "buttons": buttons
            }
        }
    }
}

exports.doCreateMainMenuItem = (shopid) => {
	var mainMenu = [];
	var item1 = {"type":"postback",  "title":"เมนูอาหาร",  "payload":"MENU&shopid=" + shopid};
	mainMenu.push(item1);
	var item2 = { "type":"postback",  "title":"เช็คบิล", "payload":"CHECK&shopid=" + shopid};
	mainMenu.push(item2);
	var item3 = {"type":"postback", "title":"แผนที่", "payload":"MAP&shopid=" + shopid};
	mainMenu.push(item3);
	return mainMenu;
}

exports.doCreateGroupMenu = (shopid, rows) => {
	const imgLink = myshopmanLink + "/img/upload/" + shopid + "/group/";
	var groups = [];
	rows.forEach((item) => {
		var ob = {title: item.name, subtitle: item.description, image_url: imgLink + item.picture};
		ob.default_action = {"type": "web_url", "messenger_extensions": false,"webview_height_ratio": "tall", "url":  imgLink + item.picture}; 
		ob.buttons = [];
		var opennow = {"type":"postback","title": "เปิดเมนู " + item.name, "payload":"OPEN&groupid=" + item.id + "&shopid=" + shopid};
		ob.buttons.push(opennow);
		groups.push(ob);
	});
	return {
		"attachment":{
		  "type":"template",
		  "payload":{
				"template_type":"generic",
				"elements": groups
			}
		}
	}
}

exports.doCreateItemMenu = (shopid, rows) => {
	const imgLink = myshopmanLink + "/img/upload/" + shopid + "/item/";
	var items = [];
	rows.forEach((item) => {
		var ob = {title: item.name, subtitle: "ราคา " + item.unit + " ล่ะ " + item.price + " บาท", image_url: imgLink + item.picture};
		ob.default_action = {"type": "web_url", "messenger_extensions": false,"webview_height_ratio": "tall", "url":  imgLink + item.picture};
		ob.buttons = [];
		var buynow = {"type":"postback","title": "สั่งเลย", "payload":"BUY&itemid=" + item.id};
		ob.buttons.push(buynow);
		var review = {"type":"postback",  "title":"อ่านรีวิว", "payload":"REVIEW&itemid=" + item.id};
		ob.buttons.push(review);
		items.push(ob);
	});
	return {
		"attachment":{
		  "type":"template",
		  "payload":{
				"template_type":"generic",
				"elements": items
			}
		}
	}
}

exports.doCreateQuickReplyBackMenu = (shopid) => {
	return {
		 "text": "หากต้องการกลับไปที่หมวดเมนูอาหารอีกครั้ง กดที่ปุม กลับ นะครับ", 
		"quick_replies":[
		  {
			"content_type":"text",
			"title":"กลับ",
			"payload":"BACK&shopid=" + shopid,
		  }
		]
	}

}

exports.doCreateQuickReplyMenu = (title, items) => {
	var qkrpls = [];
	items.forEach((item) => {
		var ob = {	"content_type":"text", "title": item.title, "payload": item.payload};
		qkrpls.push(ob);
	});

	return {
		"text": title, 
		"quick_replies": qkrpls
	}
}

