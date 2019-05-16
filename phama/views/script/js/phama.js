//food.js
/*call plug-in */
/*
	$.getScript( "/win/script/js/win-plugin.js", function( data, textStatus, jqxhr ) {
	});
*/
$.getScript( "/win/script/js/win-plugin.js");

/* control page display */
function pagination(page, total, itemsOnPage) {
	var numberOfPages = Math.ceil(total / itemsOnPage),
	start = (page - 1) * itemsOnPage + 1,
	end = Math.min(page * itemsOnPage, total);
	//console.log(`${start} to ${end} of ${total} on page ${page} of ${numberOfPages}`);
	return {from: start, to: end, totalpage: numberOfPages};
};

function createNavText(totalitem, itemperpage, currentpage, appname, pathname, suffixq) {
	var dfr = $.Deferred();
	setTimeout(function() {
		var page = Number(currentpage);
		var pagenavob = pagination(currentpage, totalitem, itemperpage);
		var posturl = "/" + appname + "/" + pathname + "?pageno=";
		//console.log(`${pagenavob.from} to ${pagenavob.to} of ${totalitem} on page ${currentpage} of ${pagenavob.totalpage}`);
		var pagenavtext = "ลำดับรายการที่กำลังแสดงผล คือรายการที่ " + pagenavob.from + " ถึงรายการที่ " + pagenavob.to +" ของจำนวนรายการทั้งหมด " + totalitem + " รายการ";
		pagenavtext = pagenavtext.concat("<br/>");
		pagenavtext = pagenavtext.concat("ระบบจะแสดงผลหน้าล่ะ " + itemperpage + " รายการ หน้าที่กำลังแสดงผล คือหน้าที่ " + currentpage + " จากจำนวน " + pagenavob.totalpage + " หน้า");
		pagenavtext = pagenavtext.concat("<br/>");
		if (currentpage > 1){
			pagenavtext = pagenavtext.concat("&nbsp;&nbsp;");
			pagenavtext = pagenavtext.concat("<a href=\"#\" onclick=\"gotoPage(\'" + posturl + 1 + suffixq + "\')\">หน้าแรก</a>");
			pagenavtext = pagenavtext.concat("&nbsp;&nbsp;");
			pagenavtext = pagenavtext.concat("|");
			pagenavtext = pagenavtext.concat("&nbsp;&nbsp;");
			pagenavtext = pagenavtext.concat("<a href=\"#\" onclick=\"gotoPage(\'" + posturl + Number(page-1) + suffixq +"\')\">หน้าก่อน</a>");
		}
		if (currentpage < pagenavob.totalpage){
			pagenavtext = pagenavtext.concat("&nbsp;&nbsp;");
			pagenavtext = pagenavtext.concat("|");
			pagenavtext = pagenavtext.concat("&nbsp;&nbsp;");
			pagenavtext = pagenavtext.concat("<a href=\"#\" onclick=\"gotoPage(\'" + posturl + Number(page+1) + suffixq +"\')\">หน้าถัดไป</a>");
			pagenavtext = pagenavtext.concat("&nbsp;&nbsp;");
			pagenavtext = pagenavtext.concat("|");
			pagenavtext = pagenavtext.concat("&nbsp;&nbsp;"); 
			pagenavtext = pagenavtext.concat("<a href=\"#\" onclick=\"gotoPage(\'" + posturl + pagenavob.totalpage + suffixq +"\')\">หน้าสุดท้าย</a>");
		}
		dfr.resolve(pagenavtext);
	}, 1000);
	return dfr.promise();
};

function gotoPage(url){
	$(location).attr('href', url);
}

/* ajax get with synchronize*/
function changeto(url, params) {
	var dfr = $.Deferred();
	$.get(url, params, function(data){
		dfr.resolve(data);
	}).fail(function(error) { 
		console.log(JSON.stringify(error));
		dfr.reject(error); 
	});
	return dfr.promise();
}

function validateForm(formAndInputSelector, msgDiv){
	var dfr = $.Deferred();
	var isValid = true;
	var i = 0;
	while((isValid) && (i < $(formAndInputSelector).length)) {
		$($(formAndInputSelector).get().reverse()).each(function(){
			var input = $(this); 
			var type = input.attr("type");
			if (type == 'text' || type == 'number'){
				var require = input.attr("require");
				if (require == 'true')	{
					var test = input.validate(msgDiv);
					if (test==false) {
						isValid = isValid && false;
					} else {
						isValid = isValid && true;
					}

				}else {
					isValid = isValid && true;
				}
			}
		});
		i++;
	}
	dfr.resolve(isValid);
	return dfr.promise();
}

/*
$.ajax({url: saveurl, type: "post",	data: savedata[0],
	success: function (data) {
		alert(JSON.stringify(data));
		console.log(JSON.stringify(data));
		$("#page-content").html(data);
	},
	error: function(jqXHR, textStatus, errorThrown) {
	   console.log(textStatus, errorThrown);
	}		
});
*/

function showMessage(msg, target, callback) {
	$(target).html("<h3>" + msg+ "</h3>");
	$(target).css({"background-color": "yellow", "color": "blue", "font-size": "20px",  "text-align": "center", "height": "50px", "line-height": "50px", "position": "relative", "z-index":"5", "opacity": "0.25"});
	$(target).show();
	$(target).animateRotate(390, 3000);
	setTimeout(function() {
		$(target).removeAttr( "style" ).hide().fadeIn();
		$(target).hide();
		callback();
	}, 4000 );
}

$.urlParam = function(name){
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results==null) {
       return null;
    }
    return decodeURI(results[1]) || 0;
}
/* refesh on edit form page for click save button on found function */
var mm = $.urlParam('mm');

if (mm == 0){
	var newUrl = location.href.replace("mm=0", "mm=1");
	window.location.href = newUrl;
}

function datetoLINEAPI(date) {
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

function timetoLINEAPI(date) {
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

function datetimeForSup(date) {
	var Adate = new Date(date);
	var dd = Adate.getDate();
	var mm = Adate.getMonth()+1; //January is 0!
	var yyyy = Adate.getFullYear();
	var hh = Adate.getHours();
	var mi = Adate.getMinutes();
	if(dd<10) {
		dd = '0'+dd
	} 
	if(mm<10) {
		mm = '0'+mm
	} 
	if(hh<10) {
		hh = '0'+hh
	} 
	if(mi<10) {
		mi = '0'+mi
	} 
	return dd + "/" + mm + "/" + yyyy  + " " + hh + ":" + mi;
}

function fullSeqNo (cno) {
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

function formatCustomerDate(date){
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
	return dd + "/" + mm + "/" + yyyy ;
}

function formatCustomerTime(date){
	var Adate = new Date(date);
	var hh = Adate.getHours();
	var mi = Adate.getMinutes();
	if(hh<10) {
		hh = '0'+hh
	} 
	if(mi<10) {
		mi = '0'+mi
	} 
	return hh + ":" + mi;
}

