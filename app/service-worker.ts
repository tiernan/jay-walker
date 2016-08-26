/// <reference path="../custom_typings/service-worker.ts" />
'use strict';

let version: string = '0.1.0';
let manifest: string = 'files-manifest.json';

self.addEventListener('install', function(event: ExtendableEvent): void {
	event.waitUntil(Promise.all([
			caches.open(version).then(function(cache: Cache): Promise<void> {
				let preloadRequest: Request = new Request(manifest);
				return fetch(preloadRequest).then(function(response: Response): Promise<void> {
					if (response.ok) {
						cache.put(preloadRequest, response.clone());
						let contentType: string = response.headers.get('content-type');
						if (contentType && contentType.indexOf('application/json') !== -1) {
							return response.json().then(function(json: Array<Request>): Promise<void> {
								return cache.addAll(json);
							}).catch(function(): Promise<boolean> {
								// bad JSON, resolve anyway
								console.log('Warning: Manifest malformed, skipping preload');
								return Promise.resolve(false);
							});
						} else {
							console.log('Warning: Manifest Content-Type mismatch.');
							return Promise.resolve();
						}
					} else {
						console.log('Notice: No manifest present; presuming dev version.');
						return Promise.resolve();
					}
				}).catch(function(error: Error): void {
					console.log('Warning: network error during install');
					throw error;
				});
			}),
			skipWaiting()
		]
	));
});

self.addEventListener('activate', function(event: ExtendableEvent): void {
	event.waitUntil(caches.keys().then(function(cacheNames: Array<string>): Promise<Promise<boolean>[]> {
		return Promise.all(
			cacheNames.map(function(cacheName: string): Promise<boolean> {
				if (cacheName !== version) {
					console.log('Deleting old cache:', cacheName);
					return caches.delete(cacheName);
				}
			})
		);
	}).then(function(): void {
		clients.claim();
	}));
});

self.addEventListener('fetch', function(event: FetchEvent): void {
	event.respondWith(caches.open(version)
		.then(function(cache: Cache): Promise<Response> {
		return cache.match(event.request).then(function(cacheResponse: Response): Promise<Response>|Response {
			return cacheResponse || fetch(event.request).then(
					function(response: Response): Response {
						if (response.ok) {
							cache.put(event.request, response.clone());
						} else {
							console.log('Warning: Bad Response for url: ' + response.url);
						}
						return response;
					}
				).catch(
					function(error: Error): void {
						throw error;
					}
				);
		});
	}));
});
