
var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/',function(req, res) {
	res.sendFile(__dirname + '/client/index.html');
});
app.use('/client',express.static(__dirname + '/client'));

serv.listen(3000,function(){
	console.log("Start server on port 3000");
});


var SOCKET_LIST = {};
var PLAYER_LIST = {};
var Taken = [];

var food = {
	x: Math.floor(500 * Math.random()),
	y: Math.floor(500 * Math.random())
};

var Player = function(id){
	var tmp = Math.floor(100 * Math.random());
	while(Taken[tmp]){
		tmp = Math.floor(100 * Math.random());
	}
	tempNumber = tmp;
	Taken[tmp] = true;
	var self = {
		x:Math.floor(500 * Math.random()),
		y:Math.floor(500 * Math.random()),
		id:id,
		number:"" + tempNumber,
		pressingRight:false,
		pressingLeft:false,
		pressingUp:false,
		pressingDown:false,
		maxSpd:10,
		score:0,
	}
	self.updatePosition = function(){
		if(self.pressingRight)
			self.x += self.maxSpd;
		if(self.pressingLeft)
			self.x -= self.maxSpd;
		if(self.pressingUp)
			self.y -= self.maxSpd;
		if(self.pressingDown)
			self.y += self.maxSpd;
		if(self.x > 500)
			self.x = 0;
		if(self.x < 0)
			self.x = 500;
		if(self.y > 500)
			self.y = 0;
		if(self.y < 0)
			self.y = 500;	
		if(self.x < food.x+10 && self.x > food.x-10 &&
			self.y < food.y+10 && self.y > food.y-10){
			console.log(self.number +" has eat "  )
		self.score++;
		food = {
			x: Math.floor(500 * Math.random()),
			y: Math.floor(500 * Math.random())
		};
		for(var i in SOCKET_LIST){
			var socket = SOCKET_LIST[i];
			socket.emit('food',food);
			socket.emit('you',self);
		}
	}
}
return self;
}

var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
	socket.id = Math.random();
	SOCKET_LIST[socket.id] = socket;

	var player = Player(socket.id);
	PLAYER_LIST[socket.id] = player;

	socket.emit('you',player);

	for(var i in SOCKET_LIST){
		var socket = SOCKET_LIST[i];
		socket.emit('food',food);
	}

	socket.on('disconnect',function(){
		delete SOCKET_LIST[socket.id];
		delete PLAYER_LIST[socket.id];
	});

	socket.on('keyPress',function(data){
		if(data.inputId === 'left')
			player.pressingLeft = data.state;
		else if(data.inputId === 'right')
			player.pressingRight = data.state;
		else if(data.inputId === 'up')
			player.pressingUp = data.state;
		else if(data.inputId === 'down')
			player.pressingDown = data.state;
	});


});

setInterval(function(){
	var pack = [];
	for(var i in PLAYER_LIST){
		var player = PLAYER_LIST[i];
		player.updatePosition();
		pack.push({
			x:player.x,
			y:player.y,
			number:player.number,
			id:player.id,
			score:player.score,
		});    
	}
	for(var i in SOCKET_LIST){
		var socket = SOCKET_LIST[i];
		socket.emit('newPositions',pack);
	}
},1000/25);