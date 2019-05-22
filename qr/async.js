const moment = require("moment");
const option = {timezoneOffset: -420};

async function doConvert(){
    const srcob = require('../../doc/json/userChats.json');
    let cobs = srcob["Ua25f68289b6dcc62653c6a6fb9db4787"];
    const ref = cobs.map((item)=>{
        return {
            sent_at: moment(item.sent_at).utcOffset(-1 * option.timezoneOffset).format('YYYY-MM-DD HH:mm:ss'),
            message: item.message,
            source: item.source,
            user_name: item.user_name,
        };
    })
    return ref;
}

function runAsync() {
    return new Promise(async (resolve, reject) => {
        try {
            const promises = [doConvert()]
            const result = await Promise.all(promises)
            resolve(result);
        } catch (err) {
            console.log(err)
        }
    
    })
}

runAsync().then((result)=>{
    //console.log(JSON.stringify(result[0]));
    result[0].forEach(item => {
        console.log("เมื่อ " + item.sent_at + "\n");
        console.log("โดย " + item.user_name + "\n");       
        console.log("ข้อความ " + item.message + "\n\n");          
    });

})
