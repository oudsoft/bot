//food-util.js
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