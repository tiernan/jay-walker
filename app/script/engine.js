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
var JayWalker;
(function (JayWalker) {
    // constants
    var COLOR_BG = '#fff';
    var COLOR_FILL = '#fff';
    var COLOR_FILL_SPLASH = '#f70';
    var COLOR_STROKE = '#000';
    var FONT_FAMILY = 'Impact';
    var FONT_SIZE = 48;
    var KEY_1 = 49;
    var KEY_2 = 50;
    var KEY_3 = 51;
    var KEY_4 = 52;
    var KEY_5 = 53;
    var KEY_6 = 54;
    var KEY_7 = 55;
    var KEY_8 = 56;
    var KEY_9 = 57;
    var KEY_DOWN = 40;
    var KEY_ENTER = 13;
    var KEY_ESCAPE = 27;
    var KEY_LEFT = 37;
    var KEY_RIGHT = 39;
    var KEY_SPACE = 32;
    var KEY_UP = 38;
    var LOG_BAD_FPS = 'Severe FPS drop!';
    var LOG_1UP = '1-Up!';
    var LOG_DISABLED = 'Disabled';
    var LOG_ENABLED = 'Enabled';
    var LOG_KEY_INVALID = 'Invalid key: ';
    var LOG_LOOP_MAIN = 'Using high resolution main loop';
    var LOG_LOOP_SUPPORT = 'Using support main loop';
    var LOG_MODE_BIT = '8-bit Mode ';
    var LOG_MODE_BLOOD = 'Blood ';
    var LOG_MODE_EASY = 'Easy Mode Enabled';
    var LOG_MODE_GOD = 'God Mode Enabled';
    var LOG_MODE_HARD = 'Hard Mode Enabled';
    var LOG_MODE_NORMAL = 'Normal Mode Enabled';
    var LOG_MODE_TRAILS = 'Leave Trails ';
    var LOG_MODE_WIMP = 'Wimp Mode Enabled';
    var LOG_OUT_OF_SYNC = 'Out of sync, skipping frames!';
    var LOG_PRELOAD_FAILED = 'failed preload';
    var NUM_BIT_FACTOR = .25;
    var NUM_MIN_FPS = 45;
    var NUM_SECOND = 1000;
    var SETTINGS_DIFFICULTY = [
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
    var TEXT_GAME_OVER = 'GAME OVER';
    var TEXT_GO = 'Go';
    var TEXT_INFINITY = '\u221E';
    var TEXT_LOADING = 'Loading...';
    var TEXT_PAUSE = '-PAUSED-';
    var TEXT_READY = 'Ready';
    var TEXT_SET = 'Set';
    var TEXT_SPLASH = 'Jay Walker\nHit ENTER to play';
    var TEXT_RETRY = 'Try again?';
    var TEXT_VICTORY = 'YOU WON!';
    var TEXT_VICTORY_CHEATER = 'YOU CHEATED!\nTry again without cheats!';
    // shortcut variable scope
    var w = window;
    var d = document;
    var domStage = d.getElementById('stage');
    var fpsDisplay = d.getElementById('fps-display');
    var framesThisSecond = 0;
    var lastFpsUpdate;
    var fps;
    var lastTime;
    var frameID;
    var started = false;
    var running = true;
    var userLive = false;
    var userVictory;
    var startX;
    var lives;
    var level;
    var bloodEnabled = true;
    var clearRedraw = true;
    var userPaused = false;
    var inputEnabled = false;
    var userCheated = false;
    var player;
    var allEnemies = [];
    var difficultyOffset = 0;
    var layout = [];
    var origin;
    var collisionBuffer = 2;
    var loop;
    var stageWidth = 1010;
    var stageHeight = 606;
    var cf = new JayWalker.CanvasFactory(domStage, stageWidth, stageHeight);
    var tm = new JayWalker.TitleManager(cf.createCanvas('text'));
    var fgCtx = cf.createCanvas('fg');
    var osFGCtx = cf.createCanvas('fg-buffer', true);
    var bgCtx = cf.createCanvas('bg', null, null, 'background');
    var bitCtx;
    // Set font and display loading text while we finish up here
    tm.style(FONT_SIZE, FONT_FAMILY);
    tm.color(COLOR_FILL_SPLASH, COLOR_STROKE);
    tm.pauseQueue(TEXT_LOADING);
    // background fill black for now
    bgCtx.fillStyle = COLOR_BG;
    bgCtx.fillRect(0, 0, stageWidth, stageHeight);
    // functions specifically set whether user input should be listened to or not
    function disableInput() {
        JayWalker.userKeys.length = 0;
        inputEnabled = false;
    }
    function enableInput() {
        inputEnabled = true;
    }
    /*
     Control functions
     */
    // Pauses the loop
    function pause() {
        running = false;
        w.cancelAnimationFrame(frameID);
    }
    // Resumes the loop
    function resume() {
        if (!userPaused && started && userLive) {
            running = true;
            frameID = w.requestAnimationFrame(resumeMain);
        }
    }
    // add listener for tab losing focus
    d.addEventListener('visibilitychange', handleVisibilityChange, false);
    // helps pause the game when user has changed tabs
    function handleVisibilityChange() {
        if (d.hidden) {
            pause();
        }
        else {
            resume();
        }
    }
    // displays ready set go text when user respawns, or starts
    function startText() {
        tm.queueText(TEXT_READY, 1);
        tm.queueText(TEXT_SET, 1, enableInput);
        tm.queueText(TEXT_GO, 1);
    }
    /* User functions */
    // makes a new player entity at the starting coordinates and resumes the game
    function respawn() {
        userLive = true;
        player = new JayWalker.Player(origin[0], origin[1]);
        if (!userVictory) {
            disableInput();
            tm.clear();
            startText();
            resume();
        }
        else {
            resume();
        }
    }
    /* User Input */
    // handles user input downPress
    function userInputDown(e) {
        switch (e.keyCode) {
            case KEY_LEFT:
            case KEY_UP:
            case KEY_RIGHT:
            case KEY_DOWN:
                if (inputEnabled) {
                    JayWalker.userKeys[e.keyCode] = true;
                }
                break;
            default:
                // no op
                break;
        }
    }
    function setDifficulty(difficultyLevel) {
        difficultyOffset = SETTINGS_DIFFICULTY[difficultyLevel].margin;
        JayWalker.baseSpeed = SETTINGS_DIFFICULTY[difficultyLevel].speed;
    }
    // handles user input upPress
    function userInputUp(e) {
        switch (e.keyCode) {
            case KEY_ENTER:
            case KEY_SPACE:
                // full reset if user has won, game hasn't begun, or out of lives
                if (userVictory || !started || !lives) {
                    gameReset();
                }
                else if (!userLive && lives) {
                    respawn();
                }
                return;
            case KEY_ESCAPE:
                if (started && userLive && !userVictory) {
                    userPause();
                }
                return;
            case KEY_LEFT:
            case KEY_UP:
            case KEY_RIGHT:
            case KEY_DOWN:
                JayWalker.userKeys[e.keyCode] = false;
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
                }
                else {
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
    function enableLowRes() {
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
    function disableLowRes() {
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
    function userPause() {
        if (userPaused) {
            userPaused = false;
            tm.resumeQueue();
            resume();
        }
        else {
            userPaused = true;
            tm.pauseQueue(TEXT_PAUSE);
            pause();
        }
    }
    /* Bootstrap functions */
    // initial BG render before starting up the loop
    function startMain() {
        renderBg();
        w.requestAnimationFrame(resumeMain);
    }
    // Reset timestamps so the game doesn't skip frames
    function resumeMain(now) {
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
    function main(now) {
        var lastID = frameID;
        computeFPS(now);
        update((now - lastTime) / NUM_SECOND);
        render();
        lastTime = now;
        if (lastID !== frameID) {
            // a new frame began before we ended our loop, warn!
            console.log(LOG_OUT_OF_SYNC);
        }
        else if (running) {
            // proceed as normal
            frameID = w.requestAnimationFrame(main);
        }
    }
    // Game loop for older browsers
    function supportMain() {
        main(Date.now());
    }
    // Compute FPS every second and display
    function computeFPS(now) {
        if (now > lastFpsUpdate + NUM_SECOND) {
            fps = framesThisSecond;
            lastFpsUpdate = now;
            framesThisSecond = 0;
            if (fps < NUM_MIN_FPS) {
                console.log(LOG_BAD_FPS);
            }
            fpsDisplay.textContent = String(fps);
        }
        else {
            framesThisSecond++;
        }
    }
    // update
    function update(dt) {
        tm.update(dt); // update title display
        updateEntities(dt);
        checkCollisions();
        checkVictory();
    }
    // update entities
    function updateEntities(dt) {
        // less GC than using .forEach
        for (var i = 0, l = allEnemies.length; i < l; i++) {
            updateEntity(allEnemies[i], dt);
        }
        player.update(dt);
    }
    function updateEntity(enemy, dt) {
        enemy.update(dt);
    }
    // check collisions
    // I'm doing a 3 step detection process for performance
    // NOTE: 2 step would work, but I'm using box and radial combined on purpose:
    // using both together allows for the collision boxes to have rounded corners so to speak
    // this is quite fast and works well with the objects I'm using
    function checkCollisions() {
        allEnemies.forEach(checkRoughCollision);
    }
    // rough collision detection
    // checks if enemy is in the 9-box surrounding the player
    function checkRoughCollision(enemy) {
        if (
        // check if enemy is +- 1 vertical cell from player
        (enemy.cellY >= player.cellYb
            && enemy.cellY <= player.cellYa)
            &&
                // check if enemy is +- 1 horizontal cell from player
                (enemy.cellX >= player.cellXb
                    && enemy.cellX <= player.cellXa)) {
            checkBoxCollision(enemy);
        }
    }
    // box collision detection
    // checks if the sprites overlap (using w, h, not actual drawn height/width)
    function checkBoxCollision(enemy) {
        enemy.edgeX = enemy.x + enemy.w;
        if (
        // check vertical and horizontal edges for a collision
        // y edge check
        // check if players top edge is between enemy's top and bottom range
        (enemy.y <= player.y && enemy.edgeY >= player.y
            || player.y <= enemy.y && player.edgeY >= enemy.y)
            &&
                // x edge check
                // check if players left edge is between enemy's left and right range
                (enemy.x <= player.x && enemy.x + enemy.w >= player.x
                    || player.x <= enemy.x && player.edgeX >= enemy.x)) {
            checkRadialCollision(enemy);
        }
    }
    // radial collision detection
    // detects if the radial clip area of the player and enemy collide
    function checkRadialCollision(enemy) {
        // find center points of the enemy and player
        var enemyX = (enemy.x + enemy.w / 2) + enemy.centerOffsetX;
        var enemyY = (enemy.y + enemy.h / 2) + enemy.centerOffsetY;
        var playerX = (player.x + player.w / 2) + player.centerOffsetX;
        var playerY = (player.y + player.h / 2) + player.centerOffsetY;
        var dx = playerX - enemyX;
        var dy = playerY - enemyY;
        var distance = calculateSquareDistance(dx, dy);
        var angle = Math.atan2(dy, dx);
        var directionX = (Math.abs(angle / Math.PI) > 0.5) ? -1 : 1;
        var directionY = (angle > 0) ? 1 : -1;
        if (distance + difficultyOffset <= calculateRadialDistance(player, angle, directionX, directionY)
            + calculateRadialDistance(enemy, -angle, -directionX, -directionY) - collisionBuffer) {
            userFailed(enemy, playerX, playerY, angle);
        }
    }
    // utility function to calculate the square distance
    function calculateSquareDistance(dx, dy) {
        return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
    }
    // utility function to calculate radial distance
    function calculateRadialDistance(entity, angle, directionX, directionY) {
        // if, circular, skip complex math and return the radius
        if (!entity.centerOffsetY && entity.radiusX === entity.radiusY) {
            return entity.radiusX;
        }
        // axial distance of collision point on ellipse
        var distX = (entity.radiusX + (directionX * entity.centerOffsetX)) * Math.cos(angle);
        var distY = (entity.radiusY + (directionY * entity.centerOffsetY)) * Math.sin(angle);
        // linear distance of collision point on ellipse
        return calculateSquareDistance(distX, distY);
    }
    // called if user collided with an enemy
    function userFailed(enemy, playerX, playerY, angle) {
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
        }
        else {
            tm.drawLives(--lives);
            tm.pauseQueue([
                generateLoseTitle(player, enemy),
                (lives) ? TEXT_RETRY : TEXT_GAME_OVER
            ].join('\n'));
        }
    }
    // generates random caption for player death using various enemy names/actions
    function generateLoseTitle(playerEntity, enemy) {
        var playerName = JayWalker.randomArrayElement(playerEntity.names);
        var enemyName = JayWalker.randomArrayElement(enemy.names);
        var enemyAction = JayWalker.randomArrayElement(enemy.actions);
        return [enemyName, enemyAction, playerName].join(' ');
    }
    // checks if player has reached the top of the level
    // also if the player has won the game (no more levels)
    function checkVictory() {
        if (!userVictory && player.cellY === 0 && player.y === JayWalker.cellOffsetY) {
            level++;
            if (JayWalker.levels[level]) {
                // load next level
                disableInput();
                pause();
                reset(player.cellX);
            }
            else {
                // No more levels so enable victory mode
                userVictory = true;
                tm.drawLives(TEXT_INFINITY);
                if (userCheated) {
                    tm.pauseQueue(TEXT_VICTORY_CHEATER);
                }
                else {
                    tm.pauseQueue(TEXT_VICTORY);
                }
            }
        }
    }
    // render entities
    function render() {
        // Clear foreground
        fgCtx.clearRect(0, 0, stageWidth, stageHeight);
        // draw player
        player.render(osFGCtx);
        // draw each enemy
        // Using for loop against guidelines: .forEach causes heavy GC
        for (var i = 0, l = allEnemies.length; i < l; i++) {
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
        }
        else {
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
    function renderBg() {
        bgCtx.clearRect(0, 0, stageWidth, stageHeight);
        for (var row = 0; row < JayWalker.gridH; row++) {
            renderBgRow(row);
        }
        if (bitCtx) {
            renderBitBg();
        }
    }
    // render background pixelated
    function renderBitBg() {
        bitCtx.drawImage(bgCtx.canvas, 0, 0, bitCtx.canvas.width, bitCtx.canvas.height);
        bgCtx.drawImage(bitCtx.canvas, 0, 0, stageWidth, stageHeight);
        bitCtx.clearRect(0, 0, bitCtx.canvas.width, bitCtx.canvas.height);
    }
    // render individual row of BG
    function renderBgRow(row) {
        for (var col = 0; col < JayWalker.gridW; col++) {
            bgCtx.drawImage(JayWalker.Resources.get(layout[row]), col * JayWalker.gridCellWidth, row * JayWalker.gridCellHeight);
        }
    }
    // render blood using collision angle to rotate sprite
    function blood(x, y, angle) {
        // draws blood if enabled
        if (bloodEnabled) {
            bgCtx.save();
            bgCtx.translate(x, y);
            bgCtx.rotate(angle);
            bgCtx.drawImage(JayWalker.Resources.get('images/blood.png'), -150, -98);
            bgCtx.restore();
            // if we're using the pixelated filter, render blood pixelated too
            if (bitCtx) {
                renderBitBg();
            }
        }
    }
    // called once resources are loaded
    function init() {
        // enable input and test for timestamp resolution
        w.requestAnimationFrame(testRAF);
        d.addEventListener('keydown', userInputDown);
        d.addEventListener('keyup', userInputUp);
        tm.pauseQueue(TEXT_SPLASH);
        tm.color(COLOR_FILL, COLOR_STROKE);
    }
    // Tests requestAnimation frame for high precision time
    function testRAF(now) {
        if (now) {
            console.log(LOG_LOOP_MAIN);
            loop = main;
        }
        else {
            console.log(LOG_LOOP_SUPPORT);
            loop = supportMain;
        }
    }
    // full reset of game (called on first launch, game over, and on victory)
    function gameReset() {
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
    function reset(x) {
        if (x) {
            startX = x;
        }
        w.cancelAnimationFrame(frameID);
        allEnemies.length = 0;
        JayWalker.loadJSON('data/' + JayWalker.levels[level], load);
    }
    // load level data and create entities
    function load(levelData) {
        started = true;
        running = true;
        origin = levelData.origin;
        // Note: it would be probably better to recycle the player object
        // new player entity at origin of level (supplant X coordinate if moving from last level)
        player = new JayWalker.Player((startX == null) ? origin[0] : startX, origin[1]);
        // reset bg times to draw
        layout.length = 0;
        // NOTE: not following style guide and voiding closures due to heavy GC
        // run through layout rows and process them one by one
        for (var i = 0, l = levelData.layout.length; i < l; i++) {
            loadLevelRow(levelData.layout[i], i);
        }
        // simulate as many game frames as the layout recommends
        var skipFrames = levelData.startFrame;
        while (skipFrames > 0) {
            update(1);
            skipFrames--;
        }
        // clear all tile text and display level name
        tm.clear();
        tm.queueText(levelData.name, 1);
        // adds the 'Ready, Set, Go'
        startText();
        // render bg/player and start the loop
        renderBg();
        render();
        userLive = true;
        w.requestAnimationFrame(startMain);
    }
    // adds row sprite to layout array, then processes enemies
    function loadLevelRow(row, rowNumber) {
        // add sprite to draw for bg
        layout[rowNumber] = row.material;
        // if enemies on row, process them
        if (row.enemies) {
            loadLevelRowEnemies(row, rowNumber);
        }
    }
    function loadLevelRowEnemies(row, rowNumber) {
        // NOTE: not following style guide and avoiding closures due to heavy GC
        // row.enemies.forEach(addEnemy, allEnemies);
        // run through enemy list and add them to the entity array
        for (var i = 0, l = row.enemies.length; i < l; i++) {
            var enemy = row.enemies[i];
            var type = JayWalker.randomArrayElement(enemy.type);
            allEnemies.push(JayWalker.createEntity(type, enemy.delay, rowNumber, row.speed, row.reverse, enemy.mode));
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
    ]).then(init, function () {
        console.log(LOG_PRELOAD_FAILED);
    });
})(JayWalker || (JayWalker = {}));
//# sourceMappingURL=engine.js.map