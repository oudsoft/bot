//myModule.js
const colors = require('colors/safe');

const months =["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวามคม"];

exports.appConst = {
	appTitle: "ระบบจัดการ Van Bot",
	appName: "win",
	userType: "sup",
	userid: 1,
	/* psid: 'U2ffb97f320994da8fb3593cd506f9c43', */
	winid: 2,
	itemperpage: 20
}

Array.prototype.allValuesSame = function() {
	for(var i = 1; i < this.length; i++){
		if(this[i] !== this[0]) return false;
	}
	return true;
}

exports.datetoLINEAPI = function (date) {
	var Adate = new Date(date);
	var dd = Adate.getDate();
	var mm = Adate.getMonth()+1; //January is 0!
	var yyyy = Adate.getFullYear();
	if(dd<10) {
		dd = '0'+dd
	} 
	if(mm<10) {
		mm = '0'+mm
	} 
	return yyyy + "-" + mm + "-" + dd;
}

exports.timetoLINEAPI = function (date) {
	var Adate = new Date(date);
	var hh = Adate.getHours();
	var mm = Adate.getMinutes();
	if(hh<10) {
		hh = '0'+hh
	} 
	if(mm<10) {
		mm = '0'+mm
	} 
	return hh + ":" + mm;
}

function parseDate(dateStr) {
    var parts = dateStr.split("-");
    return new Date(parts[0], parts[1] - 1, parts[2]);
}

exports.todateLINEAPI = function (dateStr) {
	parseDate(dateStr);
}

exports.dow = function(dateStr) {
	var thisday = parseDate(dateStr);
	//console.log(thisday.getDay());
    var weekday = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    return weekday[thisday.getDay()];
}

exports.fullSeqNo = function (cno) {
	var cnoS = String(cno);
	var cl = cnoS.length;
	var out = "";
	var i = 0;
	while (i + cl < 10)	{
		 out =  out.concat("0");
		 i++;
	}
	return out.concat(cnoS);
}

exports.formatCustomerDate = function (fullDataTime) {
	/* fullDataTime Text from timestamp of db in format 2019-01-05T07:00:00+07 */
	//console.log("fullDataTime: " + fullDataTime);
	var Adate = new Date(fullDataTime);
	var dd = Adate.getDate();
	var mm = Adate.getMonth()+1; //January is 0!
	var yyyy = Adate.getFullYear();
	if(dd<10) {
		dd = '0'+dd
	} 
	if(mm<10) {
		mm = '0'+mm
	} 
	return dd + "/" + mm + "/" + yyyy;
}

exports.formatCustomerTime = function (fullDataTime) {
	/* fullDataTime Text from timestamp of db in format 2019-01-05T07:00:00+07 */
	var Adate = new Date(fullDataTime);
	var hh = Adate.getHours();
	var mm = Adate.getMinutes();
	if(hh<10) {
		hh = '0'+hh
	} 
	if(mm<10) {
		mm = '0'+mm
	} 
	return hh + ":" + mm;
}

exports.imageProcessing = function (url) {
	console.log(colors.blue("upload file address: ") + colors.green(url));
	return new Promise(function(resolve, reject) {
        const options = {'lang': 'tha', 'psm': 3};
		const Tesseract = require('tesseract.js');
		/*
		const tesseract = require('node-tesseract-ocr');
		//const config = { lang: 'eng',  oem: 1,  psm: 3 };
		const config = { lang: 'tha',  oem: 1,  psm: 3 };
		tesseract.recognize(url, config).then(text => {
			console.log('Result:', text)
		})
		.catch(err => {
			console.log('error:', err)
		})
		*/

		Tesseract.recognize(url, {lang: 'tha'}).then(function(result) {
			resolve(result.text);
			console.log(result.text);
			//process.exit(0);
		 }).progress(function(p) {
			 console.log('progress', p) ;
			 //console.log(result["status"] + " (" +   (result["progress"] * 100) + "%)");
			 //document.getElementById("ocr_status").innerText = result["status"] + " (" + (result["progress"] * 100) + "%)";
		 }).catch(function (error) {
			console.error(error)
			reject(error);
		 });
	});
}

exports.printAtWordWrap = function (context, text, x, y, lineHeight, fitWidth) {
	fitWidth = fitWidth || 0;

	if (fitWidth <= 0) {
		context.fillText(text, x, y);
		return y;
	}
	var words = text.split(' ');
	var currentLine = 0;
	var idx = 1;
	while (words.length > 0 && idx <= words.length) {
		var str = words.slice(0, idx).join(' ');
		var w = context.measureText(str).width;
		if (w > fitWidth) {
			if (idx == 1) {
				idx = 2;
			}
			context.fillText(words.slice(0, idx - 1).join(' '), x, y + (lineHeight * currentLine));
			currentLine++;
			words = words.splice(idx - 1);
			idx = 1;
		} else {
			idx++;
		}
	}
	if (idx > 0)context.fillText(words.join(' '), x, y + (lineHeight * currentLine));
	return y + (currentLine * lineHeight) + lineHeight;
}

exports.isAllSameValues = function (Arr) {
	return Arr.allValuesSame();
}

exports.JSONgetObjectByValue = function (array, key, value) {
    return array.filter(function (object) {
        return object[key] === value;
    });
};

exports.formatThaiDate = function (fullDataTime) {
	/* fullDataTime Text from timestamp of db in format 2019-01-05T07:00:00+07 */
	//console.log("fullDataTime: " + fullDataTime);
	var Adate = new Date(fullDataTime);
	var dd = Adate.getDate();
	var mm = Number(Adate.getMonth()); //January is 0!
	var yyyy = Number(Adate.getFullYear());
	return dd + " " + months[mm] + " " + Number(yyyy + 543);
}

exports.delay = t => new Promise(resolve => setTimeout(resolve, t));