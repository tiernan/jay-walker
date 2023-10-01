# Jay Walker

A simple arcade game clone.

## Notes

### Game Features

- Three-step collision detection using grid proximity, sprite box, and tangential collision respectively.
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

## How to Build

To build the game, you will need to install either:
- [PNPM](#pnpm) (recommended)
- [Yarn](#yarn)
- [NPM](#npm)

### PNPM

PNPM is an alternative to NPM that is faster and more efficient. It is recommended to use PNPM for this project.
You can install PNPM by following the instructions on their website: [https://pnpm.io/installation](https://pnpm.io/installation)

After installation, you can build the game by running the following commands in your terminal:

```bash
pnpm install
pnpm run build
```

### Yarn

Yarn is an alternative to NPM that is faster and more efficient. You can install Yarn by following the instructions on
their website: [https://yarnpkg.com/getting-started/install](https://yarnpkg.com/getting-started/install)

After installation, you can build the game by running the following commands in your terminal:

```bash
yarn install
yarn run build
```

### NPM

If you do not wish to use PNPM or Yarn, you can use NPM instead. You can install NPM by following the instructions on
their website: [https://docs.npmjs.com/downloading-and-installing-node-js-and-npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

After installation, you can build the game by running the following commands in your terminal:

```bash
npm install
npm run build
```

> :warning: **If you are using NPM with a node version lower than 16.14**: You will need to add the following to your
> `package.json` file under the "scripts" section: `"preinstall": "npx npm-force-resolutions"`.

## How to Run

To run the game, simply open the index.html file in your favorite browser.

## How to Run Locally with Gulp

You can run the game locally using gulp with the following commands:

```bash
pnpm run start
```

or

```bash
pnpm install --global gulp-cli
gulp
```

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
6. Blood Toggle (PEGI 13)
7. Leave Trails (disable clearing before redraw)
8. Pixelate (render at 1/4 resolution)
9. 1-UP (for those stuck)

## How to Modify

You can modify the levels and/or create new levels by changing the JSON files under the src/data directory.

JSON Schema's are provided to validate against in the /schemas directory.

After modification, you should rebuild the distribution build by using the `gulp build` command in an NPM enabled terminal. (See 'How to Run Locally with Gulp' steps 1-4 above to install Gulp and dependencies)

## Change Log

Please refer to [CHANGELOG.md](CHANGELOG.md) for information on what has changed recently.

## Credits

Application Code written by Tiernan Cridland.

Top Down Assets: Unlucky Studio: [Top Down Car Sprites by Unlocky Studio](http://opengameart.org/content/free-top-down-car-sprites-by-unlucky-studio)

Udacity Assets: [frontend-nanodegree-arcade-game](https://github.com/udacity/frontend-nanodegree-arcade-game)