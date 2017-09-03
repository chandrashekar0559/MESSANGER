var express= require('express');
var app = express();
var http =require('http').Server(app);
var io = require('socket.io').listen(http);
var session = require('express-session');  // module for maintaining the sessions
var logger =  require('morgan');  // morgan does sends the logs means , if we get any exception it'll send to log with Status code.
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var mongoose = require('mongoose');
//path is used to get the our file paths
var path = require('path');

app.use(logger('dev')); // dev means it's on development 
app.use(bodyParser.json({limit:'10mb', extended:true}));
app.use(bodyParser.urlencoded({limit:'10mb',extended:true}));
app.use(cookieParser());

//session for Login/SignUp
app.use(session({
	name:'cokkieMessanger',
	secret: 'messanger oath',
	resave:true ,
	httpOnly:true ,
    proxy: true,
	saveUnintialized:true,
	cookie:{secure:false}
}))

//mongo db connection URI
var dbPath= "mongodb://localhost/messangerDB";
//mongoose promese
mongoose.Promise = global.Promise;
// Database connenction with data base Status.
dbconnect=mongoose.connect(dbPath);
//Whence database hitted to connection , log message will be display
mongoose.connection.once('connected', function() {
	console.log("Connected to database");
});

//seting the template engine
app.set('views', __dirname + '/views');
app.set('view engine','pug')

//Index page is the welcome page.
app.get('/',function(req,res){
    var sessionCheck= req.session.user;
    console.log("USER-"+req.session.user)
    if(sessionCheck){
	console.log("Welocome-tO-messanger-app!!!"+res)
	  res.sendFile(__dirname + '/views/messanger.html');
	res.redirect('/users/chat' , res);
    }
    else{
	res.redirect('/users/login');
	console.log("messanger-session-out!!!")
    }
});

io.on('connection' , function(socket){

socket.on('user', function(data){
	console.log(data+"came to online");
socket.broadcast.emit('chat message' , data+"joined");
socket.user = data;
});

socket.on('chat message', function(msg){
 if(msg != ''){
 io.emit('chat message', msg);
    console.log('message: ' +socket.user+' : '+ msg);
 }
    
  });
   socket.on("sender", function (data , req , res) {
        socket.emit("sender", data);
        socket.broadcast.emit("sender", data);
     var SESSIONUSER =   app.use(function(req,res){
        console.log("============"+req.session.user)
        return req.session.user
        });
    });

socket.on('disconnect', function(msg){
socket.broadcast.emit('chat message' , "some user left")
  });

});

//fs module is a default module for file mangement system
var fs = require('fs');
fs.readdirSync('./models').forEach(function(file){
	if(file.indexOf('.js'))
		require('./models/'+file);
});

fs.readdirSync('./controller').forEach(function(files){
		var route = require('./controller/'+'registrationLogin.js');
	route.controllerFunction(app);
});

//setting middlewaare
app.use(function(req,res,next){
	if(req.session && req.session.user){
		userModel.findOne({'email':req.session.user.email},function(err,user){
			if(user){
				// req.user = user;
				delete req.user.password; 
				req.session.user = user;
				next()
			}
			else{
				console.log("user condition failed")
			}
		});
	}
	else{
		next();
	}
});




app.use(function(err, req , res, next){
console.log("Routing error!")
res.status(err.Status || 500);
res.render('./error',{
	message: err.message,
	error:err
})
});

http.listen(5050,function(){
	console.log("messanger-Server-Is-Up");
});
