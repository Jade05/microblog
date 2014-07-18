
/**
 * Module dependencies.
 */

 var fs = require('fs'); 
 var accessLogfile = fs.createWriteStream('access.log', {flags: 'a'}); 
 var errorLogfile = fs.createWriteStream('error.log', {flags: 'a'});

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var flash = require('connect-flash');

var MongoStore = require('connect-mongo')(express);
var settings = require('./settings'); 

var app = express();

app.use(express.logger({stream: accessLogfile}));
app.configure('production', function(){ 
  app.error(function(err, req, res, next) { 
    var meta = '[' + new Date() + '] ' + req.url + '\n'; 
    errorLogfile.write(meta + err.stack + '\n'); 
    next(); 
  }); 
});


// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(flash());

app.use(express.cookieParser());
app.use(express.session({ 
    secret: settings.cookieSecret, 
    store: new MongoStore({ 
        db: settings.db 
    }) 
}));

app.use(express.methodOverride());

app.use(function (req, res, next) {
    res.locals.error = req.flash('error');
    res.locals.success = req.flash('success');
    res.locals.user = req.session.user;
    next();
});


var util = require('util');
app.locals({
     inspect: function(obj){
          return util.inspect(obj, true);
     }
});
app.use(function(req, res, next){
     res.locals.headers = req.headers;
     next();
});
app.get('/helper', function(req, res){
     res.render('helper',{
          title: 'Helpers'
     });
});

app.use(app.router);      //路由
app.use(express.static(path.join(__dirname, 'public')));    //配置静态文件服务器

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

routes(app);

