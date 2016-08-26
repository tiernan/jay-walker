/*!
 * Copyright (c) 2016, Tiernan Cridland
 *
 * Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby
 * granted, provided that the above copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 * INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER
 * IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 * PERFORMANCE OF THIS SOFTWARE.
 *
 * Jay-Walker Arcade Game Engine
 * @author Tiernan Cridland
 * @email tiernanc@gmail.com
 * @license: ISC
 */
'use strict';

if (!Promise) {
	throw new Error('Browser unsupported');
}

// add smoothing reference to Context 2D
interface CanvasRenderingContext2D {
	mozImageSmoothingEnabled: boolean;
	webkitImageSmoothingEnabled: boolean;
	imageSmoothingEnabled: boolean;
}

interface GamePosition {
	[index: number]: number;
}

namespace JayWalker {
	interface Origin {
		[index: number]: number;
	}

	interface EnemyData {
		delay: number;
		mode: number;
		type: string;
	}

	interface LevelData {
		layout: Array<LayoutRow>;
		name: string;
		origin: Origin;
		startFrame: number;
	}

	interface Layout extends Array<string> {
		[index: string]: any;
	}

	interface LayoutRow {
		enemies: Array<EnemyData>;
		material: string;
		speed: number;
		reverse: boolean;
	}

	// shortcut variable scope
	let w: Window = window;
	let d: Document = document;
	let domStage: HTMLElement = d.getElementById('stage');
	let fpsDisplay: HTMLElement = d.getElementById('fps-display');
	let framesThisSecond: number = 0;
	let lastFpsUpdate: number;
	let fps: number;
	let lastTime: number;
	let frameID: number;
	let started: boolean = false;
	let running: boolean = true;
	let userLive: boolean = false;
	let userVictory: boolean;
	let startX: number;
	let lives: number;
	let level: number;
	let bloodEnabled: boolean = true;
	let clearRedraw: boolean = true;
	let userPaused: boolean = false;
	let inputEnabled: boolean = false;
	let userCheated: boolean = false;
	let player: Player;
	let allEnemies: Array<Enemy> = [];
	let difficultyOffset: number = 0;
	let layout: Layout = [];
	let origin: GamePosition;
	let collisionBuffer: number = 2;
	let loop: (time: number) => void;
	let stageWidth: number = 1010;
	let stageHeight: number = 606;
	let cf: CanvasFactory = new CanvasFactory(domStage, stageWidth, stageHeight);
	let tm: TitleManager = new TitleManager(cf.createCanvas('text'));
	let fgCtx: CanvasRenderingContext2D = cf.createCanvas('fg');
	let osFGCtx: CanvasRenderingContext2D = cf.createCanvas('fg-buffer', true);
	let bgCtx: CanvasRenderingContext2D = cf.createCanvas('bg', null, null, 'background');
	let bitCtx: CanvasRenderingContext2D;

	// Set font and display loading text while we finish up here
	tm.style(48, 'Impact');
	tm.color('#f70', '#000');
	tm.pauseQueue('Loading...');

	// background fill black for now
	bgCtx.fillStyle = '#fff';
	bgCtx.fillRect(0, 0, stageWidth, stageHeight);

	// functions specifically set whether user input should be listened to or not
	function disableInput(): void {
		userKeys.length = 0;
		inputEnabled = false;
	}

	function enableInput(): void {
		inputEnabled = true;
	}

	/*
	 Control functions
	 */

	// Pauses the loop
	function pause(): void {
		running = false;
		w.cancelAnimationFrame(frameID);
	}

	// Resumes the loop
	function resume(): void {
		if (!userPaused && started && userLive) {
			running = true;
			frameID = w.requestAnimationFrame(resumeMain);
		}
	}

	// add listener for tab losing focus
	d.addEventListener('visibilitychange', handleVisibilityChange, false);

	// helps pause the game when user has changed tabs
	function handleVisibilityChange(): void {
		if (d.hidden) {
			pause();
		} else {
			resume();
		}
	}

	// displays ready set go text when user respawns, or starts
	function startText(): void {
		tm.queueText('Ready', 1);
		tm.queueText('Set', 1, enableInput);
		tm.queueText('Go', 1);
	}

	/* User functions */

	// makes a new player entity at the starting coordinates and resumes the game
	function respawn(): void {
		userLive = true;
		player = new Player(origin[0], origin[1]);
		if (!userVictory) {
			disableInput();
			tm.clear();
			startText();
			resume();
		} else {
			resume();
		}
	}

	/* User Input */

	// handles user input downPress
	function userInputDown(e: KeyboardEvent): void {
		switch (e.keyCode) {
			case 37: // left
			case 38: // up
			case 39: // right
			case 40: // down
				if (inputEnabled) {
					userKeys[e.keyCode] = true;
				}
				break;
			default:
				break;
		}
	}

	// handles user input upPress
	function userInputUp(e: KeyboardEvent): void {
		switch (e.keyCode) {
			case 13: // enter
			case 32: // space
				// full reset if user has won, game hasn't begun, or out of lives
				if (userVictory || !started || !lives) {
					gameReset();
					// respawn, if user has lost turn and still has lives
				} else if (!userLive && lives) {
					respawn();
				}
				return;
			case 27: // escape
				if (started && userLive && !userVictory) {
					userPause();
				}
				return;
			case 37: // left
			case 38: // up
			case 39: // right
			case 40: // down
				userKeys[e.keyCode] = false;
				break;
			case 49: // #1
				console.log('Hard Mode Enabled');
				baseSpeed = 1.2;
				difficultyOffset = -5;
				break;
			case 50: // #2
				console.log('Normal Mode Enabled');
				baseSpeed = 1;
				difficultyOffset = 0;
				break;
			case 51: // #3
				console.log('Easy Mode Enabled');
				baseSpeed = 1;
				difficultyOffset = 6;
				break;
			case 52: // #4
				console.log('Wimp Mode Enabled');
				baseSpeed = 0.8;
				difficultyOffset = 12;
				break;
			case 53: // #5
				console.log('God Mode Enabled');
				userCheated = true;
				baseSpeed = 1;
				difficultyOffset = 500;
				break;
			case 54: // #6
				bloodEnabled = !bloodEnabled;
				renderBg(); // clear blood if there
				console.log('Blood ' + ((bloodEnabled) ? 'Enabled' : 'Disabled'));
				break;
			case 55: // #7
				clearRedraw = !clearRedraw;
				console.log('Leave Trails ' + ((clearRedraw) ? 'Disabled' : 'Enabled'));
				break;
			case 56: // #8
				if (bitCtx) {
					disableLowRes();
				} else {
					enableLowRes();
				}

				break;
			case 57: // #9
				if (!userVictory && running) {
					console.log('CHEATER!');
					userCheated = true;
					lives++;
					tm.drawLives(lives);
				}
				break;
			default:
				console.log('Invalid key: ' + e.keyCode);
		}
	}

	// a fun low-res filter, access by press #8 in game
	function enableLowRes(): void {
		console.log('8-bit Mode Enabled');
		// create a smaller canvas to pixelate our images on
		bitCtx = cf.createCanvas('bit', true, .25);
		// must disable image smoothing for this effect
		bitCtx.mozImageSmoothingEnabled = false;
		bitCtx.webkitImageSmoothingEnabled = false;
		bitCtx.imageSmoothingEnabled = false;
		fgCtx.mozImageSmoothingEnabled = false;
		fgCtx.webkitImageSmoothingEnabled = false;
		fgCtx.imageSmoothingEnabled = false;
		bgCtx.mozImageSmoothingEnabled = false;
		bgCtx.webkitImageSmoothingEnabled = false;
		bgCtx.imageSmoothingEnabled = false;
		render();
		renderBg();
	}

	// disabling and cleaning up the low res filter
	function disableLowRes(): void {
		console.log('8-bit Mode Disabled');
		// destroy the small canvas
		bitCtx = null;
		// reset image smoothing
		fgCtx.mozImageSmoothingEnabled = true;
		fgCtx.webkitImageSmoothingEnabled = true;
		fgCtx.imageSmoothingEnabled = true;
		bgCtx.mozImageSmoothingEnabled = true;
		bgCtx.webkitImageSmoothingEnabled = true;
		bgCtx.imageSmoothingEnabled = true;
		render();
		renderBg();
	}

	// user actioned pause/un-pause
	function userPause(): void {
		if (userPaused) {
			userPaused = false;
			tm.resumeQueue();
			resume();
		} else {
			userPaused = true;
			tm.pauseQueue('-PAUSED-');
			pause();
		}
	}

	/* Bootstrap functions */

	// initial BG render before starting up the loop
	function startMain(): void {
		renderBg();
		w.requestAnimationFrame(resumeMain);
	}

	// Reset timestamps so the game doesn't skip frames
	function resumeMain(now: number): void {
		// XXX: Make sure things don't go out of sync
		w.cancelAnimationFrame(frameID);
		if (now === undefined) {
			now = Date.now();
		}
		lastTime = now;
		framesThisSecond = 0;
		lastFpsUpdate = now;

		frameID = w.requestAnimationFrame(loop);
	}

	/*
	 Loop Functions
	 */

	// Game loop
	function main(now: number): void {
		let lastID: number = frameID;
		computeFPS(now);
		update((now - lastTime) / 1000);
		render();
		lastTime = now;

		if (lastID !== frameID) {
			// a new frame began before we ended our loop, warn!
			console.log('Out of sync, skipping frames!');
		} else if (running) {
			// proceed as normal
			frameID = w.requestAnimationFrame(main);
		}
	}

	// Game loop for older browsers
	function supportMain(): void {
		main(Date.now());
	}

	// Compute FPS every second and display
	function computeFPS(now: number): void {
		if (now > lastFpsUpdate + 1000) {
			fps = framesThisSecond;
			lastFpsUpdate = now;
			framesThisSecond = 0;
			if (fps < 45) {
				console.log('Severe FPS drop!');
			}
			fpsDisplay.textContent = String(fps);
		} else {
			framesThisSecond++;
		}
	}

	// update
	function update(dt: number): void {
		tm.update(dt); // update title display
		updateEntities(dt);
		checkCollisions();
		checkVictory();
	}

	// update entities
	function updateEntities(dt: number): void {
		// less GC than using .forEach
		// Using for loop against Udacity coding style
		for (let i: number = 0, l: number = allEnemies.length; i < l; i++) {
			updateEntity(allEnemies[i], dt);
		}
		player.update(dt);
	}

	function updateEntity(enemy: Enemy, dt: number): void {
		enemy.update(dt);
	}

	// check collisions
	// I'm doing a 3 step detection process for performance
	// NOTE: 2 step would work, but I'm using box and radial combined on purpose:
	// using both together allows for the collision boxes to have rounded corners so to speak
	// this is quite fast and works well with the objects I'm using
	function checkCollisions(): void {
		allEnemies.forEach(checkRoughCollision);
	}

	// rough collision detection
	// checks if enemy is in the 9-box surrounding the player
	function checkRoughCollision(enemy: Enemy): void {
		if (
			// check if enemy is +- 1 vertical cell from player
		(enemy.cellY >= player.cellYb
		&& enemy.cellY <= player.cellYa)

		&&

		// check if enemy is +- 1 horizontal cell from player
		(enemy.cellX >= player.cellXb
		&& enemy.cellX <= player.cellXa)
		) {
			checkBoxCollision(enemy);
		}
	}

	// box collision detection
	// checks if the sprites overlap (using w, h, not actual drawn height/width)
	function checkBoxCollision(enemy: Enemy): void {
		enemy.edgeX = enemy.x + enemy.w;
		if (
			// check vertical and horizontal edges for a collision
		// y edge check
		// check if players top edge is between enemy's top and bottom range
		(enemy.y <= player.y && enemy.edgeY >= player.y
		// or if enemy's top edge is between players top and bottom range
		|| player.y <= enemy.y && player.edgeY >= enemy.y)

		&&

		// x edge check
		// check if players left edge is between enemy's left and right range
		(enemy.x <= player.x && enemy.x + enemy.w >= player.x
		// check if enemy's left edge is between player's left and right range
		|| player.x <= enemy.x && player.edgeX >= enemy.x)
		) {
			checkRadialCollision(enemy);
		}
	}

	// radial collision detection
	// detects if the radial clip area of the player and enemy collide
	function checkRadialCollision(enemy: Enemy): void {
		// find center points of the enemy and player
		let enemyX: number = (enemy.x + enemy.w / 2) + enemy.centerOffsetX;
		let enemyY: number = (enemy.y + enemy.h / 2) + enemy.centerOffsetY;
		let playerX: number = (player.x + player.w / 2) + player.centerOffsetX;
		let playerY: number = (player.y + player.h / 2) + player.centerOffsetY;
		let dx: number = playerX - enemyX;
		let dy: number = playerY - enemyY;
		let distance: number = calculateSquareDistance(dx, dy);
		let angle: number = Math.atan2(dy, dx);
		let directionX: number = (Math.abs(angle / Math.PI) > 0.5) ? -1 : 1;
		let directionY: number = (angle > 0) ? 1 : -1;

		if (distance + difficultyOffset <= calculateRadialDistance(player, angle, directionX, directionY)
			+ calculateRadialDistance(enemy, -angle, -directionX, -directionY) - collisionBuffer) {
			userFailed(enemy, playerX, playerY, angle);
		}
	}

	// utility function to calculate the square distance
	function calculateSquareDistance(dx: number, dy: number): number {
		return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
	}

	// utility function to calculate radial distance
	function calculateRadialDistance(entity: Entity, angle: number, directionX: number, directionY: number): number {

		// if, circular, skip complex math and return the radius
		if (!entity.centerOffsetY && entity.radiusX === entity.radiusY) {
			return entity.radiusX;
		}

		// axial distance of collision point on ellipse
		let distX: number = (entity.radiusX + (directionX * entity.centerOffsetX)) * Math.cos(angle);
		let distY: number = (entity.radiusY + (directionY * entity.centerOffsetY)) * Math.sin(angle);

		// linear distance of collision point on ellipse
		return calculateSquareDistance(distX, distY);
	}

	// called if user collided with an enemy
	function userFailed(enemy: Enemy, playerX: number, playerY: number, angle: number): void {
		// user lost his turn, so no longer live until respawn
		userLive = false;
		// blood effects for fun
		blood(playerX, playerY, angle);

		// pause until user decides to respawn
		pause();

		if (userVictory) {
			// user already won the game, respawn instantly
			// NOTE: instant respawn throws game out of sync for 1 frame but skipped in main loop
			respawn();
		} else {
			tm.drawLives(--lives);
			tm.pauseQueue([
				generateLoseTitle(player, enemy),
				(lives) ? 'Try again?' : 'GAME OVER'
			].join('\n'));
		}
	}

	// generates random caption for player death using various enemy names/actions
	function generateLoseTitle(playerEntity: Player, enemy: Enemy): string {
		let playerName: string = randomArrayElement(playerEntity.names);
		let enemyName: string = randomArrayElement(enemy.names);
		let enemyAction: string = randomArrayElement(enemy.actions);
		return [enemyName, enemyAction, playerName].join(' ');
	}

	// checks if player has reached the top of the level
	// also if the player has won the game (no more levels)
	function checkVictory(): void {
		if (!userVictory && player.cellY === 0 && player.y === cellOffsetY) {
			level++;
			if (levels[level]) {
				// load next level
				disableInput();
				pause();
				reset(player.cellX);
			} else {
				// No more levels so enable victory mode
				userVictory = true;
				tm.drawLives('\u221E');
				if (userCheated) {
					tm.pauseQueue('YOU CHEATED!\nTry again without cheats!');
				} else {
					tm.pauseQueue('YOU WON!');
				}
			}
		}
	}

	// render entities
	function render(): void {
		// Clear foreground
		fgCtx.clearRect(0, 0, stageWidth, stageHeight);

		// draw player
		player.render(osFGCtx);

		// draw each enemy
		// Using for loop against guidelines: .forEach causes heavy GC
		for (let i: number = 0, l: number = allEnemies.length; i < l; i++) {
			allEnemies[i].render(osFGCtx);
		}

		// if pixelated mode is enabled, pixelate the data before rendering to fg canvas
		if (bitCtx) {
			// drawing to smaller canvas and using GPU to pixelate
			bitCtx.drawImage(osFGCtx.canvas, 0, 0, bitCtx.canvas.width, bitCtx.canvas.height);
			// copying pixelated data back to foreground
			fgCtx.drawImage(bitCtx.canvas, 0, 0, stageWidth, stageHeight);
			// clear pixel board
			bitCtx.clearRect(0, 0, bitCtx.canvas.width, bitCtx.canvas.height);
		} else {
			// Copy off-screen canvas
			fgCtx.drawImage(osFGCtx.canvas, 0, 0);

		}

		// proceed unless 'leave trails' is enabled
		if (clearRedraw) {
			// clear off screen canvas
			osFGCtx.clearRect(0, 0, stageWidth, stageHeight);
		}

	}

	// render background
	function renderBg(): void {
		bgCtx.clearRect(0, 0, stageWidth, stageHeight);
		for (let row: number = 0; row < gridH; row++) {
			renderBgRow(row);
		}

		if (bitCtx) {
			renderBitBg();
		}
	}

	// render background pixelated
	function renderBitBg(): void {
		bitCtx.drawImage(bgCtx.canvas, 0, 0, bitCtx.canvas.width, bitCtx.canvas.height);
		bgCtx.drawImage(bitCtx.canvas, 0, 0, stageWidth, stageHeight);
		bitCtx.clearRect(0, 0, bitCtx.canvas.width, bitCtx.canvas.height);
	}

	// render individual row of BG
	function renderBgRow(row: number): void {
		for (let col: number = 0; col < gridW; col++) {
			bgCtx.drawImage(Resources.get(layout[row]), col * 101, row * 83);
		}
	}

	// render blood using collision angle to rotate sprite
	function blood(x: number, y: number, angle: number): void {
		// draws blood if enabled
		if (bloodEnabled) {
			bgCtx.save();
			bgCtx.translate(x, y);
			bgCtx.rotate(angle);
			bgCtx.drawImage(Resources.get('images/blood.png'), -150, -98);
			bgCtx.restore();

			// if we're using the pixelated filter, render blood pixelated too
			if (bitCtx) {
				renderBitBg();
			}
		}
	}

	// called once resources are loaded
	function init(): void {
		// enable input and test for timestamp resolution
		w.requestAnimationFrame(testRAF);
		d.addEventListener('keydown', userInputDown);
		d.addEventListener('keyup', userInputUp);
		tm.pauseQueue('Jay Walker\nHit ENTER to play');
		tm.color('#fff', '#000');
	}

	// Tests requestAnimation frame for high precision time
	function testRAF(now?: number): void {
		if (now) {
			console.log('Using high resolution main loop');
			loop = main;
		} else {
			console.log('Using support main loop');
			loop = supportMain;
		}
	}

	// full reset of game (called on first launch, game over, and on victory)
	function gameReset(): void {
		started = false;
		userCheated = false;
		userLive = false;
		userVictory = false;
		startX = null;
		level = 0;
		lives = 3;
		tm.drawLives(lives);
		reset();
	}

	// resets entities and starts load of level data
	function reset(x?: number): void {
		if (x) {
			startX = x;
		}

		w.cancelAnimationFrame(frameID);
		allEnemies.length = 0;

		loadJSON('data/' + levels[level], load);
	}

	/**
	 * @param {{format:number, name:string, width:number, height:number, layout:Array,
	 * origin:Array, enemies:Array startFrame:number}} levelData
	 */
	// load level data and create entities
	function load(levelData: LevelData): void {
		started = true;
		running = true;

		origin = levelData.origin;
		// Note: it would be probably better to recycle the player object
		// new player entity at origin of level (supplant X coordinate if moving from last level)
		player = new Player((startX == null) ? origin[0] : startX, origin[1]);
		// reset bg times to draw
		layout.length = 0;

		// NOTE: not following style guide and voiding closures due to heavy GC

		// run through layout rows and process them one by one
		for (let i: number = 0, l: number = levelData.layout.length; i < l; i++) {
			loadLevelRow(levelData.layout[i], i);
		}

		// simulate as many game frames as the layout recommends
		let skipFrames: number = levelData.startFrame;
		while (skipFrames > 0) {
			update(1);
			skipFrames--;
		}

		// clear all tile text and display level name
		tm.clear();
		tm.queueText(levelData.name, 1);
		// adds the 'Ready, Set, Go'
		startText();

		// render bg/player and launch start the loop
		renderBg();
		render();
		userLive = true;
		w.requestAnimationFrame(startMain);
	}

	// adds row sprite to layout array, then processes enemies
	function loadLevelRow(row: LayoutRow, rowNumber: number): void {
		// add sprite to draw for bg
		/**
		 * @property row.material Tile sprite
		 * @property row.enemies Enemy array
		 */
		layout[rowNumber] = row.material;

		// if enemies on row, process them
		if (row.enemies) {
			loadLevelRowEnemies(row, rowNumber);
		}
	}

	function loadLevelRowEnemies(row: LayoutRow, rowNumber: number): void {
		// NOTE: not following style guide and avoiding closures due to heavy GC

		// row.enemies.forEach(addEnemy, allEnemies);
		// run through enemy list and add them to the entity array
		for (let i: number = 0, l: number = row.enemies.length; i < l; i++) {

			let enemy: EnemyData = row.enemies[i];
			let type: string = randomArrayElement(enemy.type);
			allEnemies.push(
				createEntity(type, enemy.delay, rowNumber, row.speed, row.reverse, enemy.mode) as Enemy
				// new JayWalker[type](
				// 	enemy.delay, rowNumber, row.speed, row.reverse, enemy.mode
				// )
			);
		}
	}

	// Pre-load all game assets
	JayWalker.Resources.preload([
		'images/stone-block.png',
		'images/water-block.png',
		'images/grass-block.png',
		'images/enemy-bug-trim.png',
		'images/char-boy-trim.png',
		'images/enemy-police.png',
		'images/sport-car.png',
		'images/muscle-car.png',
		'images/taxi.png',
		'images/pickup.png',
		'images/truck.png',
		'images/van.png',
		'images/classic-car.png',
		'images/blood.png'
	]).then(init, function (): void {
		console.log('failed preload');
	});
}
