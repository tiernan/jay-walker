"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var JayWalker;
(function (JayWalker) {
    JayWalker.data = {};
    JayWalker.userKeys = [];
    // returns random element of array
    //noinspection JSUnusedLocalSymbols
    function randomArrayElement(a) {
        if (a instanceof Array) {
            return a[Math.floor(Math.random() * a.length)];
        }
        return a;
    }
    JayWalker.randomArrayElement = randomArrayElement;
    // load JSON data from url or file and callback once loaded
    function loadJSON(url, callback) {
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
                var XHR_1 = new XMLHttpRequest();
                // override MIME in case server is misconfigured.
                XHR_1.overrideMimeType("application/json");
                XHR_1.open('GET', url, true);
                // Note: add after open to save cycles
                XHR_1.onreadystatechange = function () {
                    if (XHR_1.readyState === 4 && XHR_1.status === 200) {
                        JayWalker.data[url] = JSON.parse(XHR_1.responseText);
                        callback(JayWalker.data[url]);
                    }
                };
                XHR_1.send();
                break;
            // loading from local file system
            case 'file:':
                // inserts compiled JSON as script
                var script = document.createElement('script');
                script.type = 'text/javascript';
                script.onload = function () {
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
    JayWalker.loadJSON = loadJSON;
    // load config immediately
    JayWalker.loadJSON('data/config.json', function (configData) {
        JayWalker.gridW = configData.width;
        JayWalker.gridH = configData.height;
        JayWalker.gridEdgeX = JayWalker.gridW - 1;
        JayWalker.gridEdgeY = JayWalker.gridH - 1;
        JayWalker.gridCellWidth = configData.cellWidth;
        JayWalker.gridCellHeight = configData.cellHeight;
        JayWalker.cellOffsetX = configData.cellOffsetX;
        JayWalker.cellOffsetY = configData.cellOffsetY;
        JayWalker.baseSpeed = configData.baseSpeed;
        JayWalker.levels = configData.levels;
    });
    // sets entity bounding box (width/height) and drawing area (spriteWidth/spriteHeight
    function setDims(width, height, spriteWidth, spriteHeight) {
        this.w = width;
        this.h = height;
        this.radiusX = Math.floor(width / 2);
        this.radiusY = Math.floor(height / 2);
        this.spriteW = (spriteWidth) ? spriteWidth : width;
        this.spriteH = (spriteHeight) ? spriteHeight : height;
    }
    // sets entity center (used for radial collision detection
    function setCenter(xOffset, yOffset) {
        this.centerOffsetX = xOffset;
        this.centerOffsetY = yOffset;
    }
    function adjustRadius(x, y) {
        this.radiusX = this.radiusX + x;
        this.radiusY = this.radiusY + y;
    }
    // generic entity class
    var Entity = (function () {
        function Entity(sprite, x, y) {
            this.sprite = sprite;
            this.x = x * JayWalker.gridCellWidth + JayWalker.cellOffsetX;
            this.y = y * JayWalker.gridCellHeight + JayWalker.cellOffsetY;
            this.cellX = x;
            this.cellY = y;
            this.frame = 0;
            this.set = 0;
        }
        Entity.prototype.render = function (context) {
            context.drawImage(JayWalker.Resources.get(this.sprite), this.spriteW * this.frame, this.spriteH * this.set, this.spriteW, this.spriteH, this.x, this.y, this.spriteW, this.spriteH);
        };
        return Entity;
    }());
    JayWalker.Entity = Entity;
    Entity.prototype.centerOffsetX = 0;
    Entity.prototype.centerOffsetY = 0;
    setDims.call(Entity.prototype, 50, 50);
    // moving entity class
    var MovingEntity = (function (_super) {
        __extends(MovingEntity, _super);
        function MovingEntity(sprite, x, y, speed) {
            _super.call(this, sprite, x, y);
            this.speed = speed;
            this.edgeY = this.y + this.h;
        }
        return MovingEntity;
    }(Entity));
    // player entity class
    var Player = (function (_super) {
        __extends(Player, _super);
        function Player(x, y) {
            _super.call(this, 'images/char-boy-trim.png', x, y, 1.2);
            this.limitX = JayWalker.gridCellWidth * JayWalker.gridW - this.w;
            this.limitY = JayWalker.gridCellHeight * JayWalker.gridH - this.h + JayWalker.cellOffsetY;
        }
        // movement updates
        Player.prototype.update = function (deltaTime) {
            if (JayWalker.userKeys[37]) {
                this.x -= Math.ceil(deltaTime * JayWalker.gridCellWidth * this.speed);
                if (this.x < 0) {
                    this.x = 0;
                }
            }
            else if (JayWalker.userKeys[39]) {
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
            }
            else if (JayWalker.userKeys[40]) {
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
        };
        return Player;
    }(MovingEntity));
    JayWalker.Player = Player;
    setDims.call(Player.prototype, 67, 77, null, 88);
    setCenter.call(Player.prototype, 0, -10);
    Player.prototype.names = ["you"];
    // enemy entity
    var Enemy = (function (_super) {
        __extends(Enemy, _super);
        function Enemy(sprite, x, y, speed, reverse) {
            _super.call(this, sprite, (reverse) ? JayWalker.gridW + x : -x, y, speed);
            this.reverse = reverse;
            this.set = (reverse) ? 1 : 0;
        }
        Enemy.prototype.update = function (dt) {
            if (!this.reverse && this.x > JayWalker.gridW * JayWalker.gridCellWidth) {
                this.x = -2 * JayWalker.gridCellWidth;
                this.cellX = -2;
            }
            else if (this.reverse && this.x + this.spriteW < 0) {
                this.x = JayWalker.gridW * JayWalker.gridCellWidth;
                this.cellX = JayWalker.gridW;
            }
            else {
                this.x += ((this.reverse) ? -1 : 1) * dt * JayWalker.gridCellWidth * this.speed * JayWalker.baseSpeed;
                this.cellX = Math.floor(this.x / JayWalker.gridCellWidth);
            }
        };
        return Enemy;
    }(MovingEntity));
    JayWalker.Enemy = Enemy;
    Enemy.prototype.names = ["P.E. #1", "Rude Boy", "Natasha", "Careless Driver"];
    Enemy.prototype.actions = ["hit", "ran over", "crashed into"];
    // bug entity
    var Bug = (function (_super) {
        __extends(Bug, _super);
        function Bug(x, y, speed, reverse) {
            _super.call(this, 'images/enemy-bug-trim.png', x, y, speed, reverse);
        }
        return Bug;
    }(Enemy));
    JayWalker.Bug = Bug;
    setDims.call(Bug.prototype, 98, 64, 99, 77);
    setCenter.call(Bug.prototype, -15, -10);
    Bug.prototype.names = ["Buster Bugsy", "Dung Beetle #1", "Dung Beetle #2", "Your Worst Nightmare", "Beetlejuice"];
    Bug.prototype.actions = ["slimed", "ate", "bit"];
    // classic car entity
    var ClassicCar = (function (_super) {
        __extends(ClassicCar, _super);
        function ClassicCar(x, y, speed, reverse) {
            _super.call(this, 'images/classic-car.png', x, y, speed, reverse);
        }
        return ClassicCar;
    }(Enemy));
    JayWalker.ClassicCar = ClassicCar;
    setDims.call(ClassicCar.prototype, 148, 63);
    adjustRadius.call(ClassicCar.prototype, -1, -1);
    ClassicCar.prototype.names = ["Jay Leno", "80's Guy", "The Fonz"];
    // muscle car entity
    var MuscleCar = (function (_super) {
        __extends(MuscleCar, _super);
        function MuscleCar(x, y, speed, reverse) {
            _super.call(this, 'images/muscle-car.png', x, y, speed, reverse);
        }
        return MuscleCar;
    }(Enemy));
    JayWalker.MuscleCar = MuscleCar;
    setDims.call(MuscleCar.prototype, 147, 69);
    adjustRadius.call(MuscleCar.prototype, -1, -3);
    MuscleCar.prototype.names = ["Clint Eastwood", "Toretto", "Burt Reynolds", "Stirling Archer"];
    // taxi entity
    var Taxi = (function (_super) {
        __extends(Taxi, _super);
        function Taxi(x, y, speed, reverse) {
            _super.call(this, 'images/taxi.png', x, y, speed, reverse);
        }
        return Taxi;
    }(Enemy));
    JayWalker.Taxi = Taxi;
    setDims.call(Taxi.prototype, 146, 75);
    adjustRadius.call(Taxi.prototype, 0, -3);
    Taxi.prototype.names = ["Benny", "Travis Bickle", "Max", "Corky"];
    // van entity
    var Van = (function (_super) {
        __extends(Van, _super);
        function Van(x, y, speed, reverse) {
            _super.call(this, 'images/van.png', x, y, speed, reverse);
        }
        return Van;
    }(Enemy));
    JayWalker.Van = Van;
    setDims.call(Van.prototype, 150, 69);
    setCenter.call(Van.prototype, -10, 0);
    adjustRadius.call(Van.prototype, -1, -10);
    Van.prototype.names = ["Krieger"];
    // lorry entity
    var Truck = (function (_super) {
        __extends(Truck, _super);
        function Truck(x, y, speed, reverse) {
            _super.call(this, 'images/truck.png', x, y, speed, reverse);
        }
        return Truck;
    }(Enemy));
    JayWalker.Truck = Truck;
    setDims.call(Truck.prototype, 298, 80);
    setCenter.call(Truck.prototype, 60, 0);
    adjustRadius.call(Truck.prototype, -2, -6);
    Truck.prototype.names = ["Bob", "Larry"];
    // truck entity
    var Pickup = (function (_super) {
        __extends(Pickup, _super);
        function Pickup(x, y, speed, reverse) {
            _super.call(this, 'images/pickup.png', x, y, speed, reverse);
        }
        return Pickup;
    }(Enemy));
    JayWalker.Pickup = Pickup;
    setDims.call(Pickup.prototype, 148, 79);
    adjustRadius.call(Pickup.prototype, -1, -4);
    Pickup.prototype.names = ["Mike", "Brent"];
    // car chase generic enemy
    var CarChaseEnemy = (function (_super) {
        __extends(CarChaseEnemy, _super);
        function CarChaseEnemy(sprite, x, y, speed, reverse, mode) {
            _super.call(this, sprite, x, y, speed, reverse);
            this.mode = mode;
            this.timingOffset = 0;
        }
        CarChaseEnemy.prototype.update = function (dt) {
            if (!this.reverse && this.x > JayWalker.gridW * JayWalker.gridCellWidth) {
                this.x = -2 * JayWalker.gridCellWidth - this.timingOffset;
                this.finishedLoop();
            }
            else if (this.reverse && this.x + this.spriteW < 0) {
                this.x = JayWalker.gridW * JayWalker.gridCellWidth + this.timingOffset;
                this.finishedLoop();
            }
            else {
                this.x += ((this.reverse) ? -1 : 1) * dt * JayWalker.gridCellWidth * this.speed * JayWalker.baseSpeed;
                if (this.mode) {
                    var bonus = dt * JayWalker.gridCellWidth * this.chaseBonus;
                    this.x += bonus;
                    this.addTimingOffset(bonus);
                }
            }
            this.cellX = Math.floor(this.x / JayWalker.gridCellWidth);
        };
        return CarChaseEnemy;
    }(Enemy));
    CarChaseEnemy.prototype.chaseBonus = .6;
    // CarChaseEnemy.prototype.;
    // sports car entity
    var SportsCar = (function (_super) {
        __extends(SportsCar, _super);
        function SportsCar(x, y, speed, reverse, mode) {
            _super.call(this, 'images/sport-car.png', x, y, speed, reverse, mode);
        }
        SportsCar.prototype.finishedLoop = function () {
            // no op
        };
        SportsCar.prototype.addTimingOffset = function () {
            // no op
        };
        return SportsCar;
    }(CarChaseEnemy));
    JayWalker.SportsCar = SportsCar;
    // Note: no names, will use the names from Enemy prototype
    setDims.call(SportsCar.prototype, 150, 69);
    adjustRadius.call(SportsCar.prototype, -1, -1);
    // police entity
    var Police = (function (_super) {
        __extends(Police, _super);
        function Police(x, y, speed, reverse, mode) {
            _super.call(this, 'images/enemy-police.png', x, y, speed, reverse, mode);
            this.frameCount = 0;
            this.chasing = true; // always start chasing, for fun
            this.timingOffset = 0;
        }
        Police.prototype.update = function (dt) {
            if (this.chasing) {
                this.frameCount++;
                if (this.frameCount >= this.frameRate) {
                    if (this.chasing) {
                        if (this.frame === 2) {
                            this.frame = 1;
                        }
                        else {
                            this.frame = 2;
                        }
                    }
                    this.frameCount = 0;
                }
            }
            CarChaseEnemy.prototype.update.call(this, dt);
        };
        // reset timing offset
        Police.prototype.finishedLoop = function () {
            this.timingOffset = 0;
            if (!this.mode) {
                this.chasing = false;
                this.frame = 0;
            }
        };
        // makes sure the police stay in sync with the rest of the game
        Police.prototype.addTimingOffset = function (time) {
            if (this.chasing && !this.mode) {
                this.timingOffset += time;
            }
        };
        return Police;
    }(CarChaseEnemy));
    JayWalker.Police = Police;
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
    var CanvasFactory = (function () {
        function CanvasFactory(element, w, h) {
            this.stage = element;
            this.w = w;
            this.h = h;
        }
        // simply creates a canvas and returns its context
        // the buffered option will return without attaching the canvas to the DOM
        CanvasFactory.prototype.createCanvas = function (name, buffered, size, className) {
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
            var canvas = this.stage.appendChild(this._createCanvasElement(name, size, className));
            return canvas.getContext('2d');
        };
        // private method for crating a canvas
        CanvasFactory.prototype._createCanvasElement = function (name, size, className) {
            var canvas = document.createElement('canvas');
            canvas.id = name;
            canvas.className = className;
            canvas.width = Math.round(this.w * size);
            canvas.height = Math.round(this.h * size);
            return canvas;
        };
        return CanvasFactory;
    }());
    JayWalker.CanvasFactory = CanvasFactory;
    //noinspection JSUnusedLocalSymbols
    function createEntity(type, x, y, speed, reverse, mode) {
        if (JayWalker[type]) {
            return new JayWalker[type](x, y, speed, reverse, mode);
        }
        else {
            throw Error('Entity not found');
        }
    }
    JayWalker.createEntity = createEntity;
    // handles the display of title in the game
    //noinspection JSUnusedLocalSymbols
    var TitleManager = (function () {
        function TitleManager(context) {
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
        TitleManager.prototype.pauseQueue = function (text) {
            this._drawText(text, true);
        };
        // resume the queue and restore previous text
        TitleManager.prototype.resumeQueue = function () {
            if (this.current) {
                this._drawText(this.current.text, true);
            }
            else {
                this.clear();
            }
        };
        // adds text to the queue
        TitleManager.prototype.queueText = function (text, timeout, callback) {
            // set default timeout
            if (!timeout) {
                timeout = 3;
            }
            this.queue.push({ callback: callback, text: text, timeout: timeout });
            if (!this.current) {
                this._nextText();
            }
        };
        // removes text from the queue
        TitleManager.prototype.dequeueText = function () {
            this.current = this.queue.shift();
        };
        // moves through the title queue, displaying as it goes
        TitleManager.prototype.update = function (dt) {
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
        };
        // clears all titles under the HUD
        TitleManager.prototype.clear = function () {
            this.context.clearRect(0, this.hudHeight, this.context.canvas.width, this.context.canvas.height);
        };
        // sets title style and estimates a line height
        TitleManager.prototype.style = function (size, family, weight) {
            if (!weight) {
                weight = 'normal';
            }
            this.context.font = weight + ' ' + size + 'pt ' + family;
            this.lineHeight = Math.round(size + size * .4);
        };
        TitleManager.prototype.color = function (foregroundColor, strokeColor) {
            this.context.fillStyle = foregroundColor;
            this.context.strokeStyle = strokeColor;
        };
        TitleManager.prototype.drawLives = function (lives) {
            this.context.save();
            // save the old line height, because we're not going to call style from this function
            var oldLineHeight = this.lineHeight;
            this.style(20, 'Arial');
            this.context.clearRect(this.context.canvas.width / 2, 0, this.context.canvas.width / 2, this.hudHeight);
            this.context.strokeText("x " + lives, this.context.canvas.width - 40, 25);
            this.context.fillText("x " + lives, this.context.canvas.width - 40, 25);
            this.context.restore();
            // restore old line height
            this.lineHeight = oldLineHeight;
        };
        TitleManager.prototype._drawText = function (text, clear) {
            if (clear) {
                this.clear();
            }
            var height = this.lineHeight;
            var lines = text.split("\n");
            var centerWidth = this.context.canvas.width / 2;
            var offsetHeight = this.context.canvas.height / 2 - (lines.length - 1) * height / 2;
            for (var i = 0, l = lines.length; i < l; i++) {
                this.context.strokeText(lines[i], centerWidth, offsetHeight + i * height);
                this.context.fillText(lines[i], centerWidth, offsetHeight + i * height);
            }
        };
        // move to the next text in the queue
        TitleManager.prototype._nextText = function () {
            this.dequeueText();
            if (this.current) {
                this._drawText(this.current.text);
            }
        };
        return TitleManager;
    }());
    JayWalker.TitleManager = TitleManager;
})(JayWalker || (JayWalker = {}));
//# sourceMappingURL=app.js.map