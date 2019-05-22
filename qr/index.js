'use strict';
let express = require('express'),
    bodyParser = require('body-parser'),
    app = express();
 
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
 
app.listen(8989, () => console.log('Example app listening on port 8989!'));
 
app.get('/', (req, res) => res.send('Hello World!'));

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
            console.log('Sender PSID: ' + sender_psid);
 
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

 // Handles messages events - will handle incoming messages
const handleMessage = (sender_psid, received_message) => {
    let response;
 
    if (received_message.text) {
		let text = received_message.text;
		console.log("This is the text of handleMessage ==> "+ text);
		if(text === 'GET_STARTED'){
			callUserProfileAPI(sender_psid, function(res) {
				//console.log(sender_psid);
				//console.log(res.first_name + " " + res.last_name + " " + res.profile_pic);
				response = askTemplate('สวัสดีค่ะพี่ ' + res.first_name + " " + res.last_name + 'พี่ชอบหนูแบบไหนดีค่ะ?');
				callSendAPI(sender_psid, response);
			});
		}
    }
}
 
// Handles postback  events - will handle incoming postbacks
const handlePostback = (sender_psid, received_postback) => {
    let response;
 
    // Get the payload for the postback
    let payload = received_postback.payload;
	console.log("This is the payload of Handles postback  ==> "+ payload);
 
    // Set the response based on the postback payload
    if (payload === 'CAT_PICS') {
        response = imageTemplate('cats', sender_psid);
        callSendAPI(sender_psid, response, function(){
            callSendAPI(sender_psid, askTemplate('ยังมีอีก อยากดูไหมจ๊ะ?'));
        });
    } else if (payload === 'DOG_PICS') {
        response = imageTemplate('dogs', sender_psid);
        callSendAPI(sender_psid, response, function(){
            callSendAPI(sender_psid, askTemplate('หีสวยๆ ยังมีอีก อยากดูไหมจ๊ะ?'));
        });
    } else if(payload === 'GET_STARTED'){
        response = askTemplate('พี่ชอบหนูแบบไหนดีค่ะ?');
		callSendAPI(sender_psid, response);
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
                        "title":"Saxy",
                        "payload":"CAT_PICS"
                    },
                    {
                        "type":"postback",
                        "title":"Undress",
                        "payload":"DOG_PICS"
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
                cb();
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
	let getUserProfile_uri = "https://graph.facebook.com/v2.6/me/messages?access_token=" + config.get('facebook.page.access_token');
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
        "uri": getUserProfile_uri,
        "qs": { "access_token": config.get('facebook.page.access_token') },
        "method": "POST",
        "json": request_body
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

const images = require('./pics');

const imageTemplate = (type, sender_id) => {
    return {
        "attachment":{
            "type":"image",
            "payload":{
                "url": getImage(type, sender_id),
                "is_reusable":true
            }
        }
    }
}

let users = {};
 
const getImage = (type, sender_id) => {
    // create user if doesn't exist
    if(users[sender_id] === undefined){
        users = Object.assign({
            [sender_id] : {
                'cats_count' : 0,
                'dogs_count' : 0
            }
        }, users);
    }
 
    let count = images[type].length, // total available images by type
        user = users[sender_id], // // user requesting image
        user_type_count = user[type+'_count'];
 
 
    // update user before returning image
    let updated_user = {
        [sender_id] : Object.assign(user, {
            [type+'_count'] : count === user_type_count + 1 ? 0 : user_type_count + 1
        })
    };
    // update users
    users = Object.assign(users, updated_user);
 
    console.log(users);
    return images[type][user_type_count];
}




/* ต
	Thank you author of this blog very mush. For idea that give me a new life.
	https://quantizd.com/building-facebook-messenger-bot-with-nodejs/
*/