/// <reference path="../../custom_typings/service-worker.ts" />
"use strict";
// check if service worker API is available
if ('serviceWorker' in navigator) {
    // register service worker
    navigator.serviceWorker.register('service-worker.js').then(function (registration) {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }).catch(function (err) {
        console.log('ServiceWorker registration failed: ', err);
    });
}
