var game;
var config = {};
window.onload = function () {
	game = new Phaser.Game(320, 480, Phaser.AUTO);
	game.resolution = window.devicePixelRatio;// nice trick!
	game.state.add("Play", play, true);
	config = {storageId: "boomdots"};
};

/*
WebFontConfig = {
	//  'active' means all requested fonts have finished loading
	//  We set a 1 second delay before calling 'createText'.
	//  For some reason if we don't the browser cannot render the text the first time it's created.
	active: function () {
		game.time.events.add(Phaser.Timer.SECOND, createText, this);
	},

	//  The Google Fonts we want to load (specify as many as you like in the array)
	google: {
		families: ['Patua One']
	}
};*/

function createText() {
	// topScore_tf.font = "Patua One";
}

var topScore_tf;
var play = function () {
};
play.prototype = {
	preload: function () {
		// game.load.script('webfont', "//ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js");
		game.load.image('clear_btn', "img/clear.png");
	},
	create: function () {
		game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
		game.scale.pageAlignHorizontally = true;
		game.scale.pageAlignVertically = true;
		game.stage.setBackgroundColor(0xf5eccd);

		if (!topScore_tf) {
			topScore_tf = game.add.text(10, 10, "Score: 0 - Best: 0", {font: "14px Arial"});
			// topScore_tf.setShadow(1, 1, 'rgba(0,0,0,0.35)', 1);
			// topScore_tf.stroke = '#ff87ab';
			// topScore_tf.strokeThickness = 1;
			// topScore_tf.resolution = .5 ;
			// var grd = topScore_tf.context.createLinearGradient(0, 0, 0, topScore_tf.canvas.height);
			// grd.addColorStop(0, '#ff87ab');
			// grd.addColorStop(1, '#fcc8c2');
			// topScore_tf.fill = grd;
			topScore_tf.fill = "#9c9783";
			// topScore_tf.addColor('#333333', topScore_tf.text.indexOf("0"));
			// topScore_tf.addColor('#9c9783', topScore_tf.text.indexOf("-"));
		}

		this.bg = game.add.sprite(0, 0);
		this.bg.fixedToCamera = true;
		this.bg.scale.setTo(game.width, game.height);
		this.bg.inputEnabled = true;
		this.bg.input.priorityID = 0; // lower priority

		this.score = 0;
		this.topScore = localStorage.getItem(config.storageId) || 0;
		this.canFire = true;
		this.enemyRad = 50;
		this.playerRad = 30;

		var graph = game.add.graphics(0, 0);
		this.enemy = makeBall(this.enemyRad, 0x9c9783, game.width, 0);
		this.player = makeBall(this.playerRad, 0xff87ab, game.width / 2, game.height / 5 * 4);

		graph.clear();
		graph.beginFill(0xff87ab);
		graph.drawCircle(0, 0, 4);
		graph.endFill();
		this.particle = graph.generateTexture(game.resolution);

		// grd.addColorStop(0, '#ff87ab');
		// grd.addColorStop(1, '#fcc8c2');

		graph.destroy();
		// this.enemy.resolution = 3 ;
		this.enemy.anchor.set(.5);
		this.player.anchor.set(.5);

		game.physics.startSystem(Phaser.Physics.ARCADE);
		// game.stage.backgroundColor = 0x337799;
		this.emitter = game.add.emitter(0, 0, 100);
		this.emitter.makeParticles(this.particle);
		this.emitter.setAlpha(1, 0, 1200);
		// this.emitter.autoAlpha = true ;
		// this.emitter.setScale(0.3, 1);
		this.emitter.gravity = 300;

		// this.clear_btn = game.add.button(game.world.centerX - 95, 400, 'clear_btn', this.onClick, this, 2, 1, 0);
		this.clear_btn = game.add.button(game.width - 30 - 10, 10, 'clear_btn', this.onClick, this, 2, 1, 0);
		this.clear_btn.priorityID = 1;
		this.clear_btn.alpha = .7 ;
		this.clear_btn.tint = 0x9c9783;
		// this.clear_btn.anchor.set(.5,.5);
		this.clear_btn.scale.set(0.4, 0.4);
		// setHitArea( this.clear_btn, 10 );
		this.clear_btn.onInputDown.add(function (e) {
			this.clear_btn.alpha = .35;
		}, this);

		this.reset();

		function setHitArea(obj, offset) {
			var w = obj.width;
			var h = obj.width;
			console.log("Size:", w, h);
			// obj.hitArea = new Phaser.Rectangle(-offset,-offset,w+offset*2,h+offset*2);
			obj.hitArea = new Phaser.Rectangle(-w / 2 - offset, -h / 2 - offset, w + offset * 2, h + offset * 2);
		}

		function makeBall(size, color, px, py) {
			console.log(this);
			px = px || 0;
			py = py || 0;
			graph.clear();
			graph.lineStyle(1, color, 1);
			graph.drawCircle(0, 0, size);
			graph.beginFill(color);
			graph.drawCircle(0, 0, size / 6);
			graph.endFill();
			return game.add.sprite(px, py, graph.generateTexture(game.resolution));
		}
	},
	onClick: function () {
		this.clear_btn.alpha = .7;
		this.topScore = this.score = 0;
		localStorage.setItem(config.storageId, 0);
		this.reset();
	},
	reset: function () {
		if (this.enemyTween) this.enemyTween.stop();
		if (this.playerTween) this.playerTween.stop();

		this.placePlayer();
		this.placeEnemy();
		this.updateScore();
	},
	update: function () {
		if (Phaser.Math.distance(this.player.x, this.player.y, this.enemy.x, this.enemy.y) < this.playerRad / 2 + this.enemyRad / 2) {
			this.enemyTween.stop();
			this.playerTween.stop();
			this.score++;

			this.emitter.x = this.enemy.x;
			this.emitter.y = this.enemy.y;
			this.emitter.start(true, 2000, null, 20);

			if (Math.abs(this.player.x - this.enemy.x) < 10) {
				this.score += 2;
			}
			this.placeEnemy();
			this.placePlayer();
			this.updateScore();
		}
	},
	placePlayer: function () {
		this.player.x = game.width / 2;
		this.player.y = game.height / 5 * 4;
		if(this.playerTween )this.playerTween.stop();
		this.playerTween = game.add.tween(this.player).to({
			y: game.height
		}, 10000 - this.score * 10, Phaser.Easing.Linear.None, true);
		this.playerTween.onComplete.add(this.die, this);
		this.bg.events.onInputDown.add(this.fire, this);
		// game.input.onDown.add(this.fire, this);
	},
	placeEnemy: function () {
		this.enemy.x = game.width - this.enemyRad / 2;
		this.enemy.y = -this.enemyRad / 2;
		var enemyEnterTween = game.add.tween(this.enemy).to({
			y: game.rnd.between(this.enemy.width * 2, game.height / 4 * 2 - this.playerRad / 2)
		}, 200, Phaser.Easing.Linear.None, true);
		enemyEnterTween.onComplete.add(this.moveEnemy, this);
	},
	moveEnemy: function () {
		// yoyo
		this.enemyTween = game.add.tween(this.enemy).to({
			x: this.enemyRad / 2
		}, 500 + game.rnd.between(0, 2500), Phaser.Easing.Cubic.InOut, true, 0, -1, true);
	},
	fire: function () {
		if (!this.canFire) return;
		this.bg.events.onInputDown.remove(this.fire, this);
		// game.input.onDown.remove(this.fire, this);
		this.playerTween.stop();
		this.playerTween = game.add.tween(this.player).to({
			y: -this.player.width
		}, 500, Phaser.Easing.Linear.None, true);
		this.playerTween.onComplete.add(this.die, this);
	},
	die: function () {
		// update local storage.
		localStorage.setItem(config.storageId, Math.max(this.score, this.topScore));
		this.updateScore();
		this.reset();
		// game.state.start("Play");
	},
	updateScore: function () {
		if (this.score > this.topScore) {
			this.topScore = this.score;
		}
		var txt = "Score: " + this.score + " - Best: " + this.topScore;
		topScore_tf.text = txt;
		var idx = txt.indexOf(String(this.score)) ;
		topScore_tf.addColor('#333333', idx );
		topScore_tf.addColor('#9c9783', txt.indexOf("-"));
		topScore_tf.addColor('#333333', txt.indexOf(String(this.topScore), idx+1));

		// topScore_tf.addColor('#333333', topScore_tf.text.indexOf("0"));
		// topScore_tf.addColor('#9c9783', topScore_tf.text.indexOf("-"));
		// topScore_tf.

	}
};