/*win-calendar.js*/

	var aryDates;
	$(document).on('click', '.weekday', onClickSelectDate);
	$(document).on('click', '.previous-bttn', onPrevClick);
	$(document).on('click', '.next-bttn', onNextClick);


	$("#date-slide-bar" ).css({"display":"none"});
	$("#date-box" ).on("focus", function() {
		$("#date-slide-bar").toggle( "slide", {direction: "up", distance: "100px"});
		//if($("#date-slide-bar").css("display") === "none") {$("#date-slide-bar").css("display", "block"); }
	});

	const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
	const weekdays = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

	function initDateSlideBar(){
		var startDate = new Date();
		aryDates = GetNextDates(startDate, 7);
		//console.log(JSON.stringify(aryDates));
		$("#date-slide-bar").empty();
		$("#date-slide-bar").append($("<span class='previous-bttn round borderBlack' id='previous-call'>&#8249;</span>"));
		aryDates.forEach(function(item){
			$("#date-slide-bar").append($("<span class='weekday " + item.dow + " borderBlack'>" + item.text + "</span>"));
		});
		$("#date-slide-bar").append($("<span class='next-bttn round borderBlack' id='next-call'>&#8250;</span>"));
	}

	function MonthAsString(monthIndex) {
		return months[monthIndex];
	}

	function DayAsString(dayIndex) {
		return weekdays[dayIndex];
	}

	function GetNextDates(startDate, daysToAdd) {
		var aryDates = [];
		for (var i = 0; i <= daysToAdd; i++) {
			var currentDate = new Date(startDate);
			currentDate.setDate(startDate.getDate() + i);
			var dowob = {};
			var budshmyear = ('' + (currentDate.getFullYear() + 543)).substr(2);
			dowob.dow = weekdays[currentDate.getDay()];
			dowob.text = currentDate.getDate() + " " + MonthAsString(currentDate.getMonth()) + " " + budshmyear;
			dowob.datetime = currentDate;
			aryDates.push(dowob);
		}
		return aryDates;
	}

	function GetPrevDates(startDate, daysToAdd) {
		var aryDates = [];
		for (var i = 0; i <= daysToAdd; i++) {
			var currentDate = new Date(startDate);
			currentDate.setDate(startDate.getDate() - i);
			var dowob = {};
			var budshmyear = ('' + (currentDate.getFullYear() + 543)).substr(2);
			dowob.dow = weekdays[currentDate.getDay()];
			dowob.text = currentDate.getDate() + " " + MonthAsString(currentDate.getMonth()) + " " + budshmyear;
			dowob.datetime = currentDate;
			aryDates.push(dowob);
		}
		return aryDates;
	}

	function onClickSelectDate(e) {
		$("#date-box" ).val(e.currentTarget.innerText);
		$("#date-slide-bar").toggle( "slide", {direction: "up", distance: "-100px"});
		$("#date-box" ).trigger({type: "dateSelected"});
	}
	function onNextClick() {
		var lastDateArr = aryDates.pop();
		aryDates = GetNextDates(lastDateArr.datetime, 7);
		$("#date-slide-bar").empty();
		$("#date-slide-bar").append($("<span class='previous-bttn round borderBlack' id='previous-call'>&#8249;</span>"));
		aryDates.forEach(function(item){
			$("#date-slide-bar").append($("<span class='weekday " + item.dow + " borderBlack'>" + item.text + "</span>"));
		});
		$("#date-slide-bar").append($("<span class='next-bttn round borderBlack' id='next-call'>&#8250;</span>"));
	}
	function onPrevClick() {
		var lastDateArr = aryDates[0];
		aryDates = GetPrevDates(lastDateArr.datetime, 7);
		aryDates.reverse();
		$("#date-slide-bar").empty();
		$("#date-slide-bar").append($("<span class='previous-bttn round borderBlack' id='previous-call'>&#8249;</span>"));
		aryDates.forEach(function(item){
			$("#date-slide-bar").append($("<span class='weekday " + item.dow + " borderBlack'>" + item.text + "</span>"));
		});
		$("#date-slide-bar").append($("<span class='next-bttn round borderBlack' id='next-call'>&#8250;</span>"));
	}
	function convertEngDate(thaiDate){
		var flagDates = thaiDate.split(" ");
		var yyyy = Number('25' + flagDates[2]) - 543;
		var mm = months.indexOf(flagDates[1]) + 1;
		if(mm<10) mm = '0'+mm;
		var dd = Number(flagDates[0]);
		if(dd<10) dd = '0'+dd;
		return yyyy + "-" + mm + "-" + dd;
	}

	function convertThaiDate(engDate){
		var flagDates = engDate.split("-");
		var yyyy = Number(flagDates[0]) + 543;
		var mm = months[flagDates[1]-1];
		var dd = Number(flagDates[2]);
		return dd + " " + mm + " " + yyyy;
	}