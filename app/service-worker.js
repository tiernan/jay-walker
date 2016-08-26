/// <reference path="../custom_typings/service-worker.ts" />
'use strict';
var version = '0.1.0';
var manifest = 'files-manifest.json';
self.addEventListener('install', function (event) {
    event.waitUntil(Promise.all([
        caches.open(version).then(function (cache) {
            var preloadRequest = new Request(manifest);
            return fetch(preloadRequest).then(function (response) {
                if (response.ok) {
                    cache.put(preloadRequest, response.clone());
                    var contentType = response.headers.get('content-type');
                    if (contentType && contentType.indexOf('application/json') !== -1) {
                        return response.json().then(function (json) {
                            return cache.addAll(json);
                        }).catch(function () {
                            // bad JSON, resolve anyway
                            console.log('Warning: Manifest malformed, skipping preload');
                            return Promise.resolve(false);
                        });
                    }
                    else {
                        console.log('Warning: Manifest Content-Type mismatch.');
                        return Promise.resolve();
                    }
                }
                else {
                    console.log('Notice: No manifest present; presuming dev version.');
                    return Promise.resolve();
                }
            }).catch(function (error) {
                console.log('Warning: network error during install');
                throw error;
            });
        }),
        skipWaiting()
    ]));
});
self.addEventListener('activate', function (event) {
    event.waitUntil(caches.keys().then(function (cacheNames) {
        return Promise.all(cacheNames.map(function (cacheName) {
            if (cacheName !== version) {
                console.log('Deleting old cache:', cacheName);
                return caches.delete(cacheName);
            }
        }));
    }).then(function () {
        clients.claim();
    }));
});
self.addEventListener('fetch', function (event) {
    event.respondWith(caches.open(version)
        .then(function (cache) {
        return cache.match(event.request).then(function (cacheResponse) {
            return cacheResponse || fetch(event.request).then(function (response) {
                if (response.ok) {
                    cache.put(event.request, response.clone());
                }
                else {
                    console.log('Warning: Bad Response for url: ' + response.url);
                }
                return response;
            }).catch(function (error) {
                throw error;
            });
        });
    }));
});
//# sourceMappingURL=service-worker.js.map