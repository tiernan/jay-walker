'use strict';
namespace JayWalker {
	export namespace Resources {
		interface ResourceArray {
			[url: string]: HTMLImageElement;
		}

		let resourceCache: ResourceArray = {};

		function _preload(url: string): Promise<HTMLImageElement> {
			return new Promise(function (
				resolve: (value?: PromiseLike<HTMLImageElement> | HTMLImageElement) => HTMLImageElement,
				reject: (value?: PromiseLike<HTMLImageElement> | HTMLImageElement) => HTMLImageElement
			): void {
				if (resourceCache[url]) {
					resolve(resourceCache[url]);
				} else {
					let img: HTMLImageElement = new Image();
					img.onerror = function (): void {
						reject();
					};
					img.onload = function (): void {
						resourceCache[url] = img;
						resolve(img);
					};

					resourceCache[url] = null;
					img.src = url;
				}
			});
		}

		export function preload(value: Array<string>|string): Promise<{}> {
			return new Promise(function (
				resolve: (value: Promise<HTMLImageElement>[]) => HTMLImageElement,
				reject: (value?: Promise<HTMLImageElement>[]) => HTMLImageElement
			): void {
				let promises: Array<Promise<HTMLImageElement>> = [];
				if (value instanceof Array) {
					value.forEach(function (url: string): void {
						promises.push(_preload(url));
					});
				} else {
					_preload(value as string);
				}

				Promise.all(promises).then(resolve, reject);
			});
		}

		export function get(url: string): HTMLImageElement {
			return resourceCache[url];
		}
	}
}
