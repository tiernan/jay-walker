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

	interface Difficulty {
		margin: number;
		speed: number;
	}

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

	// constants
	const COLOR_BG: string = '#fff';
	const COLOR_FILL: string = '#fff';
	const COLOR_FILL_SPLASH: string = '#f70';
	const COLOR_STROKE: string = '#000';

	const FONT_FAMILY: string = 'Impact';
	const FONT_SIZE: number = 48;

	const KEY_1: number = 49;
	const KEY_2: number = 50;
	const KEY_3: number = 51;
	const KEY_4: number = 52;
	const KEY_5: number = 53;
	const KEY_6: number = 54;
	const KEY_7: number = 55;
	const KEY_8: number = 56;
	const KEY_9: number = 57;
	const KEY_DOWN: number = 40;
	const KEY_ENTER: number = 13;
	const KEY_ESCAPE: number = 27;
	const KEY_LEFT: number = 37;
	const KEY_RIGHT: number = 39;
	const KEY_SPACE: number = 32;
	const KEY_UP: number = 38;

	const LOG_BAD_FPS: string = 'Severe FPS drop!';
	const LOG_1UP: string = '1-Up!';
	const LOG_DISABLED: string = 'Disabled';
	const LOG_ENABLED: string = 'Enabled';
	const LOG_KEY_INVALID: string = 'Invalid key: ';
	const LOG_LOOP_MAIN: string = 'Using high resolution main loop';
	const LOG_LOOP_SUPPORT: string = 'Using support main loop';
	const LOG_MODE_BIT: string = '8-bit Mode ';
	const LOG_MODE_BLOOD: string = 'Blood ';
	const LOG_MODE_EASY: string = 'Easy Mode Enabled';
	const LOG_MODE_GOD: string = 'God Mode Enabled';
	const LOG_MODE_HARD: string = 'Hard Mode Enabled';
	const LOG_MODE_NORMAL: string = 'Normal Mode Enabled';
	const LOG_MODE_TRAILS: string = 'Leave Trails ';
	const LOG_MODE_WIMP: string = 'Wimp Mode Enabled';
	const LOG_OUT_OF_SYNC: string = 'Out of sync, skipping frames!';
	const LOG_PRELOAD_FAILED: string = 'failed preload';

	const NUM_BIT_FACTOR: number = .25;
	const NUM_MIN_FPS: number = 45;
	const NUM_SECOND: number = 1000;

	const SETTINGS_DIFFICULTY: Array<Difficulty> = [
		{
			margin: -5,
			speed: 1.2
		},
		{
			margin: 0,
			speed: 1
		},
		{
			margin: 6,
			speed: 1
		},
		{
			margin: 12,
			speed: .8
		},
		{
			margin: 500,
			speed: 1
		}
	];

	const TEXT_GAME_OVER: string = 'GAME OVER';
	const TEXT_GO: string = 'Go';
	const TEXT_INFINITY: string = '\u221E';
	const TEXT_LOADING: string = 'Loading...';
	const TEXT_PAUSE: string = '-PAUSED-';
	const TEXT_READY: string = 'Ready';
	const TEXT_SET: string = 'Set';
	const TEXT_SPLASH: string = 'Jay Walker\nHit ENTER to play';
	const TEXT_RETRY: string = 'Try again?';
	const TEXT_VICTORY: string = 'YOU WON!';
	const TEXT_VICTORY_CHEATER: string = 'YOU CHEATED!\nTry again without cheats!';

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
	tm.style(FONT_SIZE, FONT_FAMILY);
	tm.color(COLOR_FILL_SPLASH, COLOR_STROKE);
	tm.pauseQueue(TEXT_LOADING);

	// background fill black for now
	bgCtx.fillStyle = COLOR_BG;
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
		tm.queueText(TEXT_READY, 1);
		tm.queueText(TEXT_SET, 1, enableInput);
		tm.queueText(TEXT_GO, 1);
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
			case KEY_LEFT:
			case KEY_UP:
			case KEY_RIGHT:
			case KEY_DOWN:
				if (inputEnabled) {
					userKeys[e.keyCode] = true;
				}
				break;
			default:
				// no op
				break;
		}
	}

	function setDifficulty(difficultyLevel: number): void {
		difficultyOffset = SETTINGS_DIFFICULTY[difficultyLevel].margin;
		baseSpeed = SETTINGS_DIFFICULTY[difficultyLevel].speed;
	}

	// handles user input upPress
	function userInputUp(e: KeyboardEvent): void {
		switch (e.keyCode) {
			case KEY_ENTER:
			case KEY_SPACE:
				// full reset if user has won, game hasn't begun, or out of lives
				if (userVictory || !started || !lives) {
					gameReset();
					// respawn, if user has lost turn and still has lives
				} else if (!userLive && lives) {
					respawn();
				}
				return;
			case KEY_ESCAPE: // escape
				if (started && userLive && !userVictory) {
					userPause();
				}
				return;
			case KEY_LEFT: // left
			case KEY_UP: // up
			case KEY_RIGHT: // right
			case KEY_DOWN: // down
				userKeys[e.keyCode] = false;
				break;
			case KEY_1:
				console.log(LOG_MODE_HARD);
				setDifficulty(0);
				break;
			case KEY_2:
				console.log(LOG_MODE_NORMAL);
				setDifficulty(1);
				break;
			case KEY_3:
				console.log(LOG_MODE_EASY);
				setDifficulty(2);
				break;
			case KEY_4:
				console.log(LOG_MODE_WIMP);
				setDifficulty(3);
				break;
			case KEY_5:
				console.log(LOG_MODE_GOD);
				userCheated = true;
				setDifficulty(4);
				break;
			case KEY_6:
				bloodEnabled = !bloodEnabled;
				renderBg(); // clear blood if there
				console.log(LOG_MODE_BLOOD + ((bloodEnabled) ? LOG_ENABLED : LOG_DISABLED));
				break;
			case KEY_7:
				clearRedraw = !clearRedraw;
				console.log(LOG_MODE_TRAILS + ((clearRedraw) ? LOG_DISABLED : LOG_ENABLED));
				break;
			case KEY_8:
				if (bitCtx) {
					disableLowRes();
				} else {
					enableLowRes();
				}

				break;
			case KEY_9:
				if (!userVictory && running) {
					console.log(LOG_1UP);
					userCheated = true;
					lives++;
					tm.drawLives(lives);
				}
				break;
			default:
				console.log(LOG_KEY_INVALID + e.keyCode);
		}
	}

	// a fun low-res filter, access by press #8 in game
	function enableLowRes(): void {
		console.log(LOG_MODE_BIT + LOG_ENABLED);
		// create a smaller canvas to pixelate our images on
		bitCtx = cf.createCanvas('bit', true, NUM_BIT_FACTOR);
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
		console.log(LOG_MODE_BIT + LOG_DISABLED);
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
			tm.pauseQueue(TEXT_PAUSE);
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
		update((now - lastTime) / NUM_SECOND);
		render();
		lastTime = now;

		if (lastID !== frameID) {
			// a new frame began before we ended our loop, warn!
			console.log(LOG_OUT_OF_SYNC);
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
		if (now > lastFpsUpdate + NUM_SECOND) {
			fps = framesThisSecond;
			lastFpsUpdate = now;
			framesThisSecond = 0;
			if (fps < NUM_MIN_FPS) {
				console.log(LOG_BAD_FPS);
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
				(lives) ? TEXT_RETRY : TEXT_GAME_OVER
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
				tm.drawLives(TEXT_INFINITY);
				if (userCheated) {
					tm.pauseQueue(TEXT_VICTORY_CHEATER);
				} else {
					tm.pauseQueue(TEXT_VICTORY);
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
			bgCtx.drawImage(Resources.get(layout[row]), col * JayWalker.gridCellWidth, row * JayWalker.gridCellHeight);
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
		tm.pauseQueue(TEXT_SPLASH);
		tm.color(COLOR_FILL, COLOR_STROKE);
	}

	// Tests requestAnimation frame for high precision time
	function testRAF(now?: number): void {
		if (now) {
			console.log(LOG_LOOP_MAIN);
			loop = main;
		} else {
			console.log(LOG_LOOP_SUPPORT);
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
		console.log(LOG_PRELOAD_FAILED);
	});
}
