

var buyButtLabel;
var promiseList = new Promise(function(resolve,reject){
	if(phamaRow[0].gtype == "onli") {
		getOrderItemQty(userId).then((hw) => {
			if(hw.qty > 0){
				buyButtLabel = "สั่งเลย";
			} else {
				buyButtLabel = "... ";
			}
		});
	} else if(phamaRow[0].gtype == "serv") {
		buyButtLabel = "จองเลย";
	}
	setTimeout(()=>{
		resolve(buyButtLabel);
	},1200);
});
Promise.all([promiseList]).then((ob)=>{
	$("#Phama").append("&nbsp;&nbsp;<input type='button' value='" + ob[0] + "' onclick='doBuyIt(" + phamaid + ",\"" + phamaRow[0].gtype + "\")'/>");
});

