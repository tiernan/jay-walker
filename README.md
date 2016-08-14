# Jay Walker

A simple arcade game clone.

## Notes

### Game Features

- 3 step collision detection using grid proximity, sprite box, and tangential collision respectively.
- Angular blood effects taking into account the players collision angle with an object.
- Optimized memory management. There are extremely few new objects/functions allocated during play.
- Use of Promises/A+ for preloading assets.
- Multiple canvases are used to reduce drawing complexity.
- JSON objects are converted to include scripts to allow the game to play without a web server.
- Service Worker support installing all assets upon first launch.

### Build Features

- Extensive build suite using Gulp task runner.
- Minification of all game assets including HTML, CSS, JavaScript, and images.
- Builds a file manifest for caching assets with a service worker.
- Compiles JSON data files to JavaScript for use with local browsing.
- Compiles TypeScript and Sass to JavaScript and CSS.

### Browser Support

All current desktop browsers are supported. The application uses JavaScript Promises and therefore is not compatible with Microsoft Internet Explorer.

## How to Run

There are three ways to run this application.

- Open [dist/index.html](dist/index.html) locally in your favourite browser.
- Use gulp to serve the files locally.
- Access a live version at [udacity.tiernanx.com/fewd/arcade/](http://udacity.tiernanx.com/fewd/arcade/)

### How to Run Locally with Gulp

Simply, follow the steps below to launch a simple local server:

1. Extract this archive where you desire.
2. First install [NPM](https://www.npmjs.com/).
3. Follow steps 1-5 in your OS's terminal (node.js command line in windows).
3. Install gulp's cli by entering the command `npm install --global gulp-cli`.
4. Navigate to the directory where you extracted the files, then enter the command `npm install`
5. Now to launch a local server, enter `gulp`
6. You should now be able to access the website at [localhost:8080](http://localhost:8080)

Once done, press Ctrl + C in the terminal to tell gulp to stop serving.
Unzip this entire archive, then open index.html with your favorite browser.

## Controls

### General

You can pause by pressing [escape] and may retry levels by pressing [enter].

### Player

Use the arrow keys to navigate around the playing field.

### Fun

1-9 keys all have functions

1. Hard Mode (faster enemies, larger collision radius)
2. Normal Mode (resets difficulty)
3. Easy Mode (smaller collision radius)
4. Wimp Mode (slower enemies, very small collision radius)
5. God Mode (invulnerability)
6. Blood Toggle (PEGI 13!)
7. Leave Trails (disable clearing before redraw)
8. Pixelate (render at 1/4 resolution)
9. 1-UP (for those stuck)

## How to Modify

You can modify the levels and/or create new levels by changing the JSON files under the src/data directory.

JSON Schema's are provided to validate against in the /schemas directory.

After modification, you should rebuild the distribution build by using the `gulp build` command in an NPM enabled terminal. (See 'How to Run Locally with Gulp' steps 1-4 above to install Gulp and dependencies)

## Credits

Application Code written by Tiernan Cridland.

Top Down Assets: Unlucky Studio: [Top Down Car Sprites by Unlocky Studio](http://opengameart.org/content/free-top-down-car-sprites-by-unlucky-studio)

Udacity Assets: [frontend-nanodegree-arcade-game](https://github.com/udacity/frontend-nanodegree-arcade-game)