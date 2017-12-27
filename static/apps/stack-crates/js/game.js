var game;

var gameOpts = {
	timeLimit:60,
	gravity:1500,
	crateSpeed:1000,
	crateHorizontalRange:540,
	fallingHeight:500,
	localStorageName:"stack-crates",
	gameWidth:640,
	gameHeight:960
};

window.onload = function(){
	var winW = window.innerWidth;
	var winH = window.innerHeight;
	var ratio = winH / winW ;
	if( ratio >= 1 ){
		if( ratio <= 1.5 ){
			gameOpts.gameWidth = gameOpts.gameHeight / ratio ;
		} else {
			gameOpts.gameHeight = gameOpts.gameWidth * ratio ;
		}
	}
	game = new Phaser.Game(gameOpts.gameWidth, gameOpts.gameHeight, Phaser.AUTO );
	game.state.add("PlayGame", playGame);
	game.state.start("PlayGame");
};

var ground_h;
var crate_h;

var playGame = function(){};

playGame.prototype = {
	preload:function(){

		game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
		game.scale.pageAlignHorizontally = true ;
		game.scale._pageAlignVertically = true ;
		game.stage.disableVisibilityChange = true ;

		// game.load.image("ground", "../assets/sprites/ground.png");
		/*
		game.load.image("sky", "../assets/sprites/sky.png");
		game.load.image("crate", "../assets/sprites/crate.png");
		game.load.image("title", "../assets/sprites/title.png");
		game.load.image("tap", "../assets/sprites/tap.png");*/

		game.load.atlasXML("spr", "assets/sprites/sprites.png", "assets/sprites/sprites.xml" );

		game.load.audio("hit01", ["assets/sounds/hit01.mp3"]);
		game.load.audio("hit02", ["assets/sounds/hit02.mp3"]);
		game.load.audio("hit03", ["assets/sounds/hit03.mp3"]);
		game.load.audio("remove", ["assets/sounds/remove.mp3"]);
		game.load.audio("gameover", ["assets/sounds/gameover.mp3"]);
		game.load.bitmapFont("font", "assets/fonts/font.png", "assets/fonts/font.fnt");
		game.load.bitmapFont("smallfont", "assets/fonts/smallfont.png", "assets/fonts/smallfont.fnt");

		console.log("preloader");
	},
	create:function(){
		if( !Phaser.Device.desktop ){
			game.scale.forceOrientation(false,true);
			game.scale.enterIncorrectOrientation.add(function(){
				game.paused = true ;
				document.querySelector("canvas").style.display = "none";
				document.querySelector("#game").style.display = "block";
			});
			game.scale.leaveIncorrectOrientation.add(function(){
				game.paused = false ;
				document.querySelector("canvas").style.display = "block";
				document.querySelector("#game").style.display = "none";
			});
		}

		this.lastSoundPlayed = Date.now();
		this.savedData = !localStorage.getItem(gameOpts.localStorageName) ? {score:0} : JSON.parse(localStorage.getItem(gameOpts.localStorageName));
		this.hitSound = [game.add.audio('hit01'), game.add.audio('hit02'), game.add.audio('hit03')];
		this.gameOverSound = game.add.audio("gameover");
		this.removeSound= game.add.audio("remove");

		// console.log("SOOO",game.cache.getImage("spr"));
		// console.log("SOOO",game.cache.getImage("ground"));
		//
		this.score = 0 ;
		// ground_h = game.cache.getImage("ground").height;
		// crate_h = game.cache.getImage("crate").height;

		this.firstCrate = true ;

		var sky = game.add.image(0,0, "spr" ,"sky");
		sky.width = game.width ;
		sky.height = game.height ;

		this.cameraGroup = game.add.group();
		this.crateGroup = game.add.group();
		this.cameraGroup.add(this.crateGroup);

		game.physics.startSystem(Phaser.Physics.BOX2D);
		game.physics.box2d.gravity.y = gameOpts.gravity;
		this.canDrop = true ;

		var ground = game.add.sprite(game.width>>1, game.height, "spr", "ground");
		ground_h = ground.height;
		ground.y = game.height - ground.height / 2 ;

		this.movingCrate =  game.add.sprite( game.width - gameOpts.crateHorizontalRange >> 1, game.height - ground_h - gameOpts.fallingHeight,"spr" , "crate" );
		crate_h = this.movingCrate.height ;

		this.movingCrate.anchor.set(.5);
		this.cameraGroup.add( this.movingCrate );
		var crateTween = game.add.tween(this.movingCrate).to({
			x: (game.width + gameOpts.crateHorizontalRange ) / 2
		}, gameOpts.crateSpeed, Phaser.Easing.Linear.None, true, 0, -1, true );
		game.physics.box2d.enable(ground);
		ground.body.friction = 1 ;
		ground.body.static= true ;
		ground.body.setCollisionCategory(1);
		this.cameraGroup.add(ground);

		game.input.onDown.add( this.dropCrate, this );
		this.menuGroup = game.add.group();
		var tap = game.add.sprite(game.width/2, game.height/2, "spr" ,"tap");
		tap.anchor.set(.5);
		this.menuGroup.add(tap);

		var title = game.add.image(game.width/2, tap.y - 470, "spr" ,"title");
		title.anchor.set(.5, 0);
		this.menuGroup.add(title);

		var hiscoreText = game.add.bitmapText(game.width/2, game.height-20, "font", this.savedData.score.toString(), 72 );
		hiscoreText.anchor.set(.5);
		this.menuGroup.add(hiscoreText);

		var tapTween = game.add.tween(tap).to({
			alpha:0
		}, 300, Phaser.Easing.Cubic.InOut, true, 0, -1, true );

	},
	update:function(){
		this.crateGroup.forEach(function(i){
			if( i.y > game.height + i .height ){
				if( !i.hit ) this.getMaxHeight();
				i.destroy();
			}
		}, this );
		// console.log("update");
	},
	scaleCamera:function(camScale){
		var moveTween = game.add.tween(this.cameraGroup).to({
			x: (game.width-game.width * camScale)/2,
			y: game.height-game.height * camScale
		}, 200, Phaser.Easing.Quadratic.In, true );
		var scaleTween= game.add.tween(this.cameraGroup.scale).to({
			x: camScale,
			y: camScale
		}, 200, Phaser.Easing.Quadratic.In, true );
		scaleTween.onComplete.add(function(){
			this.canDrop = true ;
			this.movingCrate.alpha = 1 ;
			/*var alphaTween = game.add.tween(this.movingCrate).to({
				alpha:1
			}, 1200, Phaser.Easing.Quadratic.Out, true ) ;*/
			var scaleTween = game.add.tween(this.movingCrate.scale).to({
				x: 1,
				y: 1
			}, 900, Phaser.Easing.Elastic.Out, true );
		}, this );;
	},
	getMaxHeight:function(){
		var maxH = 0 ;
		this.crateGroup.forEach(function(i){
			if( i.hit ){
				var h = Math.round((game.height- ground_h - i.y - crate_h/2) / crate_h) + 1 ;
				maxH = Math.max(h, maxH);
			}
		}, this );
		this.movingCrate.y = game.height - ground_h - maxH * crate_h - gameOpts.fallingHeight ;
		var newH = game.height + crate_h * maxH;
		var ratio = game.height / newH ;
		this.scaleCamera(ratio);
	},
	tick:function(){
		this.timer++;
		this.timeText.text = (gameOpts.timeLimit - this.timer).toString();
		if( this.timer > gameOpts.timeLimit ){
			game.time.events.remove(this.timerEvent);
			this.movingCrate.destroy();
			this.timeText.destroy();
			game.time.events.add( 500, function(){
				this.crateGroup.forEach(function(i){
					i.body.static = true ;
				}, true );
				this.removeEvent = game.time.events.loop(Phaser.Timer.SECOND/10, this.removeCrate, this );
			}, this );
		}
	},
	removeCrate:function(){
		if( this.crateGroup.children.length > 0 ){
			var tempCrate = this.crateGroup.getChildAt(0);
			var h = Math.round((game.height-ground_h - tempCrate.y - crate_h /2 ) / crate_h ) + 1;
			this.score += h ;
			this.removeSound.play();
			var crateScoreText = game.add.bitmapText(tempCrate.x, tempCrate.y, "smallfont", h.toString(), 20);
			crateScoreText.anchor.set(.5);
			this.cameraGroup.add(crateScoreText);
			tempCrate.destroy() ;
		} else {
			game.time.events.remove( this.removeEvent ) ;
			this.gameOverSound.play() ;
			var scoreText = game.add.bitmapText(game.width/2, game.height/5, "font", "YOUR POINTS:", 72 );
			scoreText.anchor.set(.5);
			var scoreDisplayText = game.add.bitmapText( game.width/2, game.height/5+140, "font", this.score.toString(), 144 );
			scoreDisplayText.anchor.set(.5);
			localStorage.setItem(gameOpts.localStorageName, JSON.stringify({score:Math.max(this.score, this.savedData.score)}));
			game.time.events.add(Phaser.Timer.SECOND * 5, function(){
				game.state.start("PlayGame");
			}, this );
		}
	},
	dropCrate:function(){
		if( this.firstCrate ){
			this.firstCrate = false ;
			this.menuGroup.destroy();
			this.timer = 0 ;
			this.timerEvent = game.time.events.loop(Phaser.Timer.SECOND, this.tick, this);
			this.timeText = game.add.bitmapText(10,10,"font", gameOpts.timeLimit.toString(), 72 );
		}

		if( this.canDrop && this.timer <= gameOpts.timeLimit ){
			this.canDrop = false ;
			this.movingCrate.alpha = 0 ;
			this.movingCrate.scale.set(0,0);

			var fallingCrate = game.add.sprite(this.movingCrate.x, this.movingCrate.y, "spr" , "crate");
			fallingCrate.hit = false ;


			game.physics.box2d.enable(fallingCrate);
			fallingCrate.body.friction = 1 ;
			fallingCrate.body.bullet = true ;

			this.crateGroup.add(fallingCrate);
			fallingCrate.body.setCollisionCategory(1);
			fallingCrate.body.setCategoryContactCallback(1, function(b, b2, fix1, fix2, contact, impulseInfo){
				var dly = Date.now() - this.lastSoundPlayed ;
				if( dly > 200 && this.timer <= gameOpts.timeLimit ){
					this.lastSoundPlayed = Date.now();
					Phaser.ArrayUtils.getRandomItem(this.hitSound).play() ;
				}
				if( !b.sprite.hit ){
					b.sprite.hit = true ;
					b.bullet = false ;
					this.getMaxHeight();
				}
			}, this );
		}
	}
};
