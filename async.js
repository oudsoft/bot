const moment = require("moment");
const option = {timezoneOffset: -420};

async function doConvertUserChats(){
    const srcob = require('../doc/json/userChats.json');
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

async function doConvertUserTickets(){
    const srcob = require('../doc/json/userTickets.json');
    let logs = srcob["Ua25f68289b6dcc62653c6a6fb9db4787"];
    // logs = srcob.log;
    const ref = logs.map((item)=>{
        return {
            created_at: moment(item.log.created_timestamp).utcOffset(-1 * option.timezoneOffset).format('YYYY-MM-DD HH:mm:ss'),
            closed_at: moment(item.log.closed_timestamp).utcOffset(-1 * option.timezoneOffset).format('YYYY-MM-DD HH:mm:ss'),
            /*
            message: item.message,
            source: item.source,
            user_name: item.user_name,
            */
        };
    })
    return ref;
}

function runAsync() {
    return new Promise(async (resolve, reject) => {
        try {
            const promises = [doConvertUserChats(), doConvertUserTickets()]
            const result = await Promise.all(promises)
            resolve(result);
        } catch (err) {
            console.log(err)
        }
    
    })
}

async function runAsync2() {
    const promises = await [doConvertUserChats(), doConvertUserTickets()]
    const result = await Promise.all(promises)
    return (result);
}

/*
runAsync().then((result)=>{
    result[0].forEach(item => {
        console.log("เมื่อ " + item.sent_at + "\n");
        console.log("โดย " + item.user_name + "\n");       
        console.log("ข้อความ " + item.message + "\n\n");          
    });
    result[1].forEach(item => {
        console.log("เปิด " + item.created_at + "\n");
        console.log("ปิด " + item.closed_at + "\n");              
    });
})
*/

async function run(){
    const sync = await runAsync2();
    sync[0].forEach(item => {
        console.log("เมื่อ " + item.sent_at + "\n");
        console.log("โดย " + item.user_name + "\n");       
        console.log("ข้อความ " + item.message + "\n\n");          
    });
    sync[1].forEach(item => {
        console.log("เปิด " + item.created_at + "\n");
        console.log("ปิด " + item.closed_at + "\n");              
    });
}

run();
