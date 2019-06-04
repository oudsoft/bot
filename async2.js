function doFindArray(arrs, feild, target){
	const found = arrs.filter((item) => {
		return item[feild] == target
	});
	return found;
}

function doRunAsync(arrs, field, target) {
    const promises = [doFindArray(arrs, field, target)];
    const result = Promise.all(promises)
    return result;
}

async function doRunFind(){
    /*
    let arrs = [
        {id: 1, name: 'Hello', other: '30'},
        {id: 2, name: 'World', other: '70'},
        {id: 3, name: 'foo', other: '11'},  
        {id: 4, name: 'boo', other: '14'},   
        {id: 5, name: 'normal', other: '21'},    
        {id: 6, name: 'extra', other: '23'},                          
    ];
    */
    const srcob = require('../doc/json/userChats.json');
    let arrs = srcob["Ua25f68289b6dcc62653c6a6fb9db4787"];
    let feild = 'source';
    let target = 'agent';

    const founds = await doRunAsync(arrs, feild, target);
    if (founds){
        founds.forEach(item => {
            console.log(item);
        });
    } else {
        console.log("Not Found");
    }
}

doRunFind();