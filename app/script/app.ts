"use strict";

namespace JayWalker {
	interface ConfigData {
		width: number;
		height: number;
		cellWidth: number;
		cellHeight: number;
		cellOffsetX: number;
		cellOffsetY: number;
		baseSpeed: number;
		levels: Array<string>;
	}

	interface KeyArray extends Array<boolean> {
		[index: number]: boolean;
	}

	interface Drawable {
		render(context: CanvasRenderingContext2D): void;
		update(dt: number): void;
	}

	interface DataArray {
		[index: string]: DataObject;
	}

	interface DataObject {
		[index: string]: any;
	}

	export let gridW: number;
	export let gridH: number;
	export let gridEdgeX: number;
	export let gridEdgeY: number;
	export let gridCellWidth: number;
	export let gridCellHeight: number;
	export let cellOffsetX: number;
	export let cellOffsetY: number;
	export let baseSpeed: number;
	export let levels: Array<string>;

	export let data: DataArray = {};
	export let userKeys: KeyArray = [];

	// returns random element of array
	//noinspection JSUnusedLocalSymbols
	export function randomArrayElement(a: Array<string>|string): string {
		if (a instanceof Array) {
			return a[Math.floor(Math.random() * a.length)];
		}
		return a as string;
	}

	// load JSON data from url or file and callback once loaded
	export function loadJSON(url: string, callback: (data: Object) => void): void {
		// return immediately if data is in cache
		if (JayWalker.data[url]) {
			callback(JayWalker.data[url]);
			return;
		}

		// choose load method depending on protocol
		switch (window.location.protocol) {

			// loading over http/https
			case 'http:':
			case 'https:':
				let XHR: XMLHttpRequest = new XMLHttpRequest();
				// override MIME in case server is misconfigured.
				XHR.overrideMimeType("application/json");
				XHR.open('GET', url, true);

				// Note: add after open to save cycles
				XHR.onreadystatechange = function (): void {
					if (XHR.readyState === 4 && XHR.status === 200) {
						JayWalker.data[url] = JSON.parse(XHR.responseText);
						callback(JayWalker.data[url]);
					}
				};
				XHR.send();
				break;

			// loading from local file system
			case 'file:':

				// inserts compiled JSON as script
				let script: HTMLScriptElement = document.createElement('script');
				script.type = 'text/javascript';
				script.onload = function (): void {
					callback(JayWalker.data[url]);
				};
				script.src = url.substring(0, url.length - 2);
				document.head.appendChild(script);
				break;

			// throw error if protocol unknown; I'm sorry future
			default:
				throw new Error('Unknown protocol');
		}
	}

	// load config immediately
	JayWalker.loadJSON('data/config.json', function (configData: ConfigData): void {
		gridW = configData.width;
		gridH = configData.height;
		gridEdgeX = JayWalker.gridW - 1;
		gridEdgeY = JayWalker.gridH - 1;
		gridCellWidth = configData.cellWidth;
		gridCellHeight = configData.cellHeight;
		cellOffsetX = configData.cellOffsetX;
		cellOffsetY = configData.cellOffsetY;
		baseSpeed = configData.baseSpeed;
		levels = configData.levels;
	});

	// sets entity bounding box (width/height) and drawing area (spriteWidth/spriteHeight
	function setDims(width: number, height: number, spriteWidth?: number, spriteHeight?: number): void {
		this.w = width;
		this.h = height;
		this.radiusX = Math.floor(width / 2);
		this.radiusY = Math.floor(height / 2);
		this.spriteW = (spriteWidth) ? spriteWidth : width;
		this.spriteH = (spriteHeight) ? spriteHeight : height;
	}

	// sets entity center (used for radial collision detection
	function setCenter(xOffset: number, yOffset: number): void {
		this.centerOffsetX = xOffset;
		this.centerOffsetY = yOffset;
	}

	function adjustRadius(x: number, y: number): void {
		this.radiusX = this.radiusX + x;
		this.radiusY = this.radiusY + y;
	}

	// generic entity class
	export abstract class Entity {
		public sprite: string;
		public x: number;
		public y: number;
		public cellX: number;
		public cellY: number;
		public frame: number;
		public set: number;
		public w: number;
		public h: number;
		public radiusX: number;
		public radiusY: number;
		public spriteW: number;
		public spriteH: number;

		public centerOffsetX: number;
		public centerOffsetY: number;

		constructor(sprite: string, x: number, y: number) {
			this.sprite = sprite;
			this.x = x * gridCellWidth + cellOffsetX;
			this.y = y * gridCellHeight + cellOffsetY;
			this.cellX = x;
			this.cellY = y;
			this.frame = 0;
			this.set = 0;
		}

		public render(context: CanvasRenderingContext2D): void {
			context.drawImage(Resources.get(this.sprite), this.spriteW * this.frame, this.spriteH * this.set,
				this.spriteW, this.spriteH, this.x, this.y, this.spriteW, this.spriteH);
		}
	}

	Entity.prototype.centerOffsetX = 0;
	Entity.prototype.centerOffsetY = 0;
	setDims.call(Entity.prototype, 50, 50);

	// moving entity class
	abstract class MovingEntity extends Entity {
		public speed: number;
		public edgeY: number;

		constructor(sprite: string, x: number, y: number, speed: number) {
			super(sprite, x, y);

			this.speed = speed;
			this.edgeY = this.y + this.h;
		}

		public abstract update(deltaTime: number): void;
	}

	// player entity class
	export class Player extends MovingEntity implements Drawable {
		public limitX: number;
		public limitY: number;
		public names: Array<string>;
		public edgeX: number;
		public cellXa: number;
		public cellXb: number;
		public cellYa: number;
		public cellYb: number;

		constructor(x: number, y: number) {
			super('images/char-boy-trim.png', x, y, 1.2);

			this.limitX = JayWalker.gridCellWidth * JayWalker.gridW - this.w;
			this.limitY = JayWalker.gridCellHeight * JayWalker.gridH - this.h + JayWalker.cellOffsetY;
		}

		// movement updates
		public update(deltaTime: number): void {
			if (JayWalker.userKeys[37]) {
				this.x -= Math.ceil(deltaTime * JayWalker.gridCellWidth * this.speed);
				if (this.x < 0) {
					this.x = 0;
				}
			} else if (JayWalker.userKeys[39]) {
				this.x += Math.ceil(deltaTime * JayWalker.gridCellWidth * this.speed);
				if (this.x > this.limitX) {
					this.x = this.limitX;
				}
			}
			if (JayWalker.userKeys[38]) {
				this.y -= Math.ceil(deltaTime * JayWalker.gridCellHeight * this.speed);
				if (this.y < JayWalker.cellOffsetY) {
					this.y = JayWalker.cellOffsetY;
				}
			} else if (JayWalker.userKeys[40]) {
				this.y += Math.ceil(deltaTime * JayWalker.gridCellHeight * this.speed);
				if (this.y > this.limitY) {
					this.y = this.limitY;
				}
			}

			this.cellX = Math.floor(this.x / JayWalker.gridCellHeight);
			this.cellY = Math.floor(this.y / JayWalker.gridCellHeight);

			// Note: it would be better to use the largest sprite dims for both dirs and stop calculating by cell

			// collision vars (so we don't have to do multiple calculations or memory copies for collision detection
			// NOTE: above/below is referring to mathematics, not rendering location on canvas
			this.cellXa = this.cellX + 1; // cell X above -- player is 1 cell wide
			this.cellXb = this.cellX - 2; // cell X below -- some vehicles are larger than 1 cell in width
			this.cellYa = this.cellY + 1; // cell Y above -- player is 1 cell tall
			this.cellYb = this.cellY - 1; // cell X below -- all vehicles are less than 1 cell tall

			this.edgeX = this.x + this.w;
			this.edgeY = this.y + this.h;
		}
	}

	setDims.call(Player.prototype, 67, 77, null, 88);
	setCenter.call(Player.prototype, 0, -10);
	Player.prototype.names = ["you"];

	// enemy entity
	export abstract class Enemy extends MovingEntity implements Drawable {
		public names: Array<string>;
		public actions: Array<string>;
		public edgeX: number;
		protected reverse: boolean;

		constructor(sprite: string, x: number, y: number, speed: number, reverse: boolean) {
			super(sprite, (reverse) ? JayWalker.gridW + x : -x, y, speed);

			this.reverse = reverse;
			this.set = (reverse) ? 1 : 0;
		}

		public update(dt: number): void {
			if (!this.reverse && this.x > JayWalker.gridW * JayWalker.gridCellWidth) {
				this.x = -2 * JayWalker.gridCellWidth;
				this.cellX = -2;
			} else if (this.reverse && this.x + this.spriteW < 0) {
				this.x = JayWalker.gridW * JayWalker.gridCellWidth;
				this.cellX = JayWalker.gridW;
			} else {
				this.x += ((this.reverse) ? -1 : 1) * dt * JayWalker.gridCellWidth * this.speed * JayWalker.baseSpeed;
				this.cellX = Math.floor(this.x / JayWalker.gridCellWidth);
			}
		}
	}

	Enemy.prototype.names = ["P.E. #1", "Rude Boy", "Natasha", "Careless Driver"];
	Enemy.prototype.actions = ["hit", "ran over", "crashed into"];

	// bug entity
	export class Bug extends Enemy implements Drawable {
		constructor(x: number, y: number, speed: number, reverse: boolean) {
			super('images/enemy-bug-trim.png', x, y, speed, reverse);
		}
	}

	setDims.call(Bug.prototype, 98, 64, 99, 77);
	setCenter.call(Bug.prototype, -15, -10);
	Bug.prototype.names = ["Buster Bugsy", "Dung Beetle #1", "Dung Beetle #2", "Your Worst Nightmare", "Beetlejuice"];
	Bug.prototype.actions = ["slimed", "ate", "bit"];

	// classic car entity
	export class ClassicCar extends Enemy implements Drawable {
		constructor(x: number, y: number, speed: number, reverse: boolean) {
			super('images/classic-car.png', x, y, speed, reverse);
		}
	}

	setDims.call(ClassicCar.prototype, 148, 63);
	adjustRadius.call(ClassicCar.prototype, -1, -1);
	ClassicCar.prototype.names = ["Jay Leno", "80's Guy", "The Fonz"];

	// muscle car entity
	export class MuscleCar extends Enemy implements Drawable {
		constructor(x: number, y: number, speed: number, reverse: boolean) {
			super('images/muscle-car.png', x, y, speed, reverse);
		}
	}

	setDims.call(MuscleCar.prototype, 147, 69);
	adjustRadius.call(MuscleCar.prototype, -1, -3);
	MuscleCar.prototype.names = ["Clint Eastwood", "Toretto", "Burt Reynolds", "Stirling Archer"];

	// taxi entity
	export class Taxi extends Enemy implements Drawable {
		constructor(x: number, y: number, speed: number, reverse: boolean) {
			super('images/taxi.png', x, y, speed, reverse);
		}
	}

	setDims.call(Taxi.prototype, 146, 75);
	adjustRadius.call(Taxi.prototype, 0, -3);
	Taxi.prototype.names = ["Benny", "Travis Bickle", "Max", "Corky"];

	// van entity
	export class Van extends Enemy implements Drawable {
		constructor(x: number, y: number, speed: number, reverse: boolean) {
			super('images/van.png', x, y, speed, reverse);
		}
	}

	setDims.call(Van.prototype, 150, 69);
	setCenter.call(Van.prototype, -10, 0);
	adjustRadius.call(Van.prototype, -1, -10);
	Van.prototype.names = ["Krieger"];

	// lorry entity
	export class Truck extends Enemy implements Drawable {
		constructor(x: number, y: number, speed: number, reverse: boolean) {
			super('images/truck.png', x, y, speed, reverse);
		}
	}

	setDims.call(Truck.prototype, 298, 80);
	setCenter.call(Truck.prototype, 60, 0);
	adjustRadius.call(Truck.prototype, -2, -6);
	Truck.prototype.names = ["Bob", "Larry"];

	// truck entity
	export class Pickup extends Enemy implements Drawable {
		constructor(x: number, y: number, speed: number, reverse: boolean) {
			super('images/pickup.png', x, y, speed, reverse);
		}
	}

	setDims.call(Pickup.prototype, 148, 79);
	adjustRadius.call(Pickup.prototype, -1, -4);
	Pickup.prototype.names = ["Mike", "Brent"];

	// car chase generic enemy
	abstract class CarChaseEnemy extends Enemy implements Drawable {
		public chaseBonus: number;
		protected timingOffset: number;
		protected mode: number;

		constructor(sprite: string, x: number, y: number, speed: number, reverse: boolean, mode: number) {
			super(sprite, x, y, speed, reverse);

			this.mode = mode;
			this.timingOffset = 0;
		}

		public update(dt: number): void {
			if (!this.reverse && this.x > JayWalker.gridW * JayWalker.gridCellWidth) {
				this.x = -2 * JayWalker.gridCellWidth - this.timingOffset;
				this.finishedLoop();
			} else if (this.reverse && this.x + this.spriteW < 0) {
				this.x = JayWalker.gridW * JayWalker.gridCellWidth + this.timingOffset;
				this.finishedLoop();
			} else {
				this.x += ((this.reverse) ? -1 : 1) * dt * JayWalker.gridCellWidth * this.speed * JayWalker.baseSpeed;
				if (this.mode) {
					let bonus: number = dt * JayWalker.gridCellWidth * this.chaseBonus;
					this.x += bonus;
					this.addTimingOffset(bonus);
				}

			}
			this.cellX = Math.floor(this.x / JayWalker.gridCellWidth);
		}

		protected abstract finishedLoop(): void;

		protected abstract addTimingOffset(time?: number): void;
	}

	CarChaseEnemy.prototype.chaseBonus = .6;

	// CarChaseEnemy.prototype.;

	// sports car entity
	export class SportsCar extends CarChaseEnemy implements Drawable {
		constructor(x: number, y: number, speed: number, reverse: boolean, mode: number) {
			super('images/sport-car.png', x, y, speed, reverse, mode);
		}

		protected finishedLoop(): void {
			// no op
		}

		protected addTimingOffset(): void {
			// no op
		}
	}

	// Note: no names, will use the names from Enemy prototype
	setDims.call(SportsCar.prototype, 150, 69);
	adjustRadius.call(SportsCar.prototype, -1, -1);

	// police entity
	export class Police extends CarChaseEnemy implements Drawable {
		public frameRate: number;
		private chasing: boolean;
		private frameCount: number;

		constructor(x: number, y: number, speed: number, reverse: boolean, mode: number) {
			super('images/enemy-police.png', x, y, speed, reverse, mode);

			this.frameCount = 0;
			this.chasing = true; // always start chasing, for fun
			this.timingOffset = 0;
		}

		public update(dt: number): void {
			if (this.chasing) {
				this.frameCount++;
				if (this.frameCount >= this.frameRate) {
					if (this.chasing) {
						if (this.frame === 2) {
							this.frame = 1;
						} else {
							this.frame = 2;
						}
					}
					this.frameCount = 0;
				}
			}

			CarChaseEnemy.prototype.update.call(this, dt);
		}

		// reset timing offset
		protected finishedLoop(): void {
			this.timingOffset = 0;
			if (!this.mode) {
				this.chasing = false;
				this.frame = 0;
			}
		}

		// makes sure the police stay in sync with the rest of the game
		protected addTimingOffset(time: number): void {
			if (this.chasing && !this.mode) {
				this.timingOffset += time;
			}
		}
	}

	setDims.call(Police.prototype, 150, 69);
	Police.prototype.frameRate = 10;
	Police.prototype.names = [
		"Officer McDonuts",
		"Chief Wiggum",
		"David Starsky",
		"Kenneth Hutchinson",
		"Debrah Morgan",
		"Sergeant Batista"
	];
	Police.prototype.actions = ["busted", "caught", "hit", "crashed into", "arrested"];

	// canvas building factory
	//noinspection JSUnusedLocalSymbols
	export class CanvasFactory {
		private stage: HTMLElement;
		private w: number;
		private h: number;

		constructor(element: HTMLElement, w: number, h: number) {
			this.stage = element;
			this.w = w;
			this.h = h;
		}

		// simply creates a canvas and returns its context
		// the buffered option will return without attaching the canvas to the DOM
		public createCanvas(name: string, buffered?: boolean, size?: number,
							className?: string): CanvasRenderingContext2D {

			// default params
			if (typeof buffered !== 'boolean') {
				buffered = false;
			}

			if (!size) {
				size = 1;
			}

			if (!className) {
				className = 'layer';
			}

			if (buffered) {
				return this._createCanvasElement(name, size, className).getContext('2d');
			}

			let canvas: HTMLCanvasElement = this.stage.appendChild(
				this._createCanvasElement(name, size, className)) as HTMLCanvasElement;

			return canvas.getContext('2d');
		}

		// private method for crating a canvas
		private _createCanvasElement(name: string, size: number, className: string): HTMLCanvasElement {
			let canvas: HTMLCanvasElement = document.createElement('canvas');
			canvas.id = name;
			canvas.className = className;
			canvas.width = Math.round(this.w * size);
			canvas.height = Math.round(this.h * size);

			return canvas;
		}
	}

	//noinspection JSUnusedLocalSymbols
	export function createEntity(type: string, x: number, y: number, speed: number, reverse: boolean,
								 mode: number): Entity {
		if (JayWalker[type]) {
			return new JayWalker[type](x, y, speed, reverse, mode);
		} else {
			throw Error('Entity not found');
		}
	}

	interface TitleText {
		text: string;
		timeout: number;
		callback: Function;
	}

	// handles the display of title in the game
	//noinspection JSUnusedLocalSymbols
	export class TitleManager {
		public hudHeight: number;
		public lineHeight: number;
		public context: CanvasRenderingContext2D;
		public queue: Array<TitleText>;
		public current: TitleText;

		constructor(context: CanvasRenderingContext2D) {
			context.textBaseline = 'middle';
			context.textAlign = "center";
			context.lineWidth = 3;
			context.strokeStyle = "#000";
			context.fillStyle = "#fff";

			this.hudHeight = 40;
			this.lineHeight = 6;
			this.context = context;
			this.queue = [];
			this.current = null;
		}

		// temporarily pause the queue and display this text
		public pauseQueue(text: string): void {
			this._drawText(text, true);
		}

		// resume the queue and restore previous text
		public resumeQueue(): void {
			if (this.current) {
				this._drawText(this.current.text, true);
			} else {
				this.clear();
			}
		}

		// adds text to the queue
		public queueText(text: string, timeout?: number, callback?: Function): void {
			// set default timeout
			if (!timeout) {
				timeout = 3;
			}

			this.queue.push({callback: callback, text: text, timeout: timeout});

			if (!this.current) {
				this._nextText();
			}
		}

		// removes text from the queue
		public dequeueText(): void {
			this.current = this.queue.shift();
		}

		// moves through the title queue, displaying as it goes
		public update(dt: number): void {
			if (this.current) {
				this.current.timeout -= dt;

				if (this.current.timeout < 0) {
					//this.display = false;
					this.clear();

					if (this.current.callback) {
						this.current.callback();
					}

					this._nextText();
				}
			}
		}

		// clears all titles under the HUD
		public clear(): void {
			this.context.clearRect(0, this.hudHeight, this.context.canvas.width, this.context.canvas.height);
		}

		// sets title style and estimates a line height
		public style(size: number, family: string, weight?: string): void {
			if (!weight) {
				weight = 'normal';
			}

			this.context.font = weight + ' ' + size + 'pt ' + family;
			this.lineHeight = Math.round(size + size * .4);
		}

		public drawLives(lives: number|string): void {

			this.context.save();
			// save the old line height, because we're not going to call style from this function
			let oldLineHeight: number = this.lineHeight;

			this.style(20, 'Arial');
			this.context.clearRect(this.context.canvas.width / 2, 0, this.context.canvas.width / 2, this.hudHeight);
			this.context.strokeText("x " + lives, this.context.canvas.width - 40, 25);
			this.context.fillText("x " + lives, this.context.canvas.width - 40, 25);
			this.context.restore();

			// restore old line height
			this.lineHeight = oldLineHeight;
		}

		private _drawText(text: string, clear?: boolean): void {
			if (clear) {
				this.clear();
			}

			let height: number = this.lineHeight;
			let lines: Array<string> = text.split("\n");
			let centerWidth: number = this.context.canvas.width / 2;
			let offsetHeight: number = this.context.canvas.height / 2 - (lines.length - 1) * height / 2;

			for (let i: number = 0, l: number = lines.length; i < l; i++) {
				this.context.strokeText(lines[i], centerWidth, offsetHeight + i * height);
				this.context.fillText(lines[i], centerWidth, offsetHeight + i * height);
			}
		}

		// move to the next text in the queue
		private _nextText(): void {
			this.dequeueText();

			if (this.current) {
				this._drawText(this.current.text);
			}
		}
	}
}