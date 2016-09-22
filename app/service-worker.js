/// <reference path="../custom_typings/service-worker.ts" />
'use strict';
var APP = 'jay-walker';
var MANIFEST = 'files-manifest.json';
var VERSION = '1.0.0';
var cacheID = APP + '-' + VERSION;
var cacheEnabled = true;
self.addEventListener('install', function (event) {
    var preloadRequest = new Request(MANIFEST);
    event.waitUntil(fetch(preloadRequest)
        .then(function (response) {
        if (response.ok) {
            return response.json();
        }
        else {
            console.log('Notice: No manifest present; presuming dev version.');
            cacheEnabled = false;
            return Promise.resolve([]);
        }
    })
        .then(function (json) {
        if (Array.isArray(json)) {
            return caches.open(cacheID)
                .then(function (cache) {
                return cache.addAll(json);
            });
        }
        else {
            return Promise.reject(new Error('Manifest is not an array'));
        }
    }));
});
self.addEventListener('activate', function (event) {
    event.waitUntil(caches.keys()
        .then(function (cacheNames) {
        return Promise.all(cacheNames.map(function (cacheName) {
            if (cacheName.startsWith(APP) && cacheName !== cacheID) {
                return caches.delete(cacheName);
            }
        }));
    }));
});
self.addEventListener('fetch', function (event) {
    event.respondWith(caches.open(cacheID)
        .then(function (cache) {
        return cache.match(event.request)
            .then(function (cacheResponse) {
            return cacheResponse ||
                fetch(event.request)
                    .then(function (response) {
                    if (cacheEnabled && response.ok) {
                        cache.put(event.request, response.clone());
                    }
                    return response;
                });
        });
    }));
});
//# sourceMappingURL=service-worker.js.map