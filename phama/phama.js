//phama.js
const colors = require('colors/safe');
const util = require("util");
const fs = require('fs');

var express = require('express');
var app = express();

/**
 * Express Validator Middleware for Form Validation
 */
var expressValidator = require('express-validator');
app.use(expressValidator());


/**
 * body-parser module is used to read HTTP POST data
 * it's an express middleware that reads form's input 
 * and store it as javascript object
 */
var bodyParser = require('body-parser');
/**
 * bodyParser.urlencoded() parses the text as URL encoded data 
 * (which is how browsers tend to send form data from regular forms set to POST) 
 * and exposes the resulting object (containing the keys and values) on req.body.
 */
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

/**
 * This module let us use HTTP verbs such as PUT or DELETE 
 * in places where they are not supported
 */
var methodOverride = require('method-override');

/**
 * using custom logic to override method
 * 
 * there are other ways of overriding as well
 * like using header & using query value
 */
app.use(methodOverride(function (req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        // look in urlencoded POST bodies and delete it
        var method = req.body._method;
        delete req.body._method;
        return method;
    }
}))

/**
 * This module shows flash messages
 * generally used to show success or error messages
 * 
 * Flash messages are stored in session
 * So, we also have to install and use 
 * cookie-parser & session modules
 */
var flash = require('express-flash');
var cookieParser = require('cookie-parser');
var session = require('express-session');

app.use(cookieParser('keyboard cat'))
app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true,
    cookie: {
        maxAge: 60000,
        secure: false
    }
}))
app.use(flash());

/**
 * setting up the templating view engine
 */
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.use("/style", express.static(__dirname + "/views/style/css"));
app.use("/theme", express.static(__dirname + "/views/style/theme"));
app.use("/font", express.static(__dirname + "/res/font"));
app.use("/img", express.static(__dirname + "/res/img"));
app.use("/script", express.static(__dirname + "/views/script"));

/*admin*/

var index = require('./app/index.js');
var phamagroup = require('./app/phamagroup.js');
var phamaitem = require('./app/phamaitem.js');
var about = require('./app/about.js');
var orders = require('./app/orders.js');
var reviews = require('./app/reviews.js');
var totalchat = require('./app/totalchat.js');

/*webhook*/
var webhook = require('./api/phamahook.js');
var phamareview = require('./api/phamareview.js');
var shopreview = require('./api/shopreview.js');
/* app declair */

app.use('/', index);
app.use('/phamagroup', phamagroup);
app.use('/phamaitem', phamaitem);
app.use('/about', about);
app.use('/orders', orders);
app.use('/reviews', reviews);
app.use('/totalchat', totalchat);

app.use('/webhook', webhook);
app.use('/phamareview', phamareview);
app.use('/shopreview', shopreview);

const server = app.listen(7331, function () {
    const host = server.address().address;
    const port = server.address().port;
    console.log(colors.green('Server running at port 7331: http://127.0.0.1:7331'));
})

/* 
	Basic ID = @865hlgtu
*/

/*
git commit phama/lib/webhookapi.js -m "My 3th commit"
git push -u origin master
*/