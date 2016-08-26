/// <reference path="../../custom_typings/service-worker.ts" />
'use strict';

// check if service worker API is available
if ('serviceWorker' in navigator) {
	// register service worker
	navigator.serviceWorker.register('service-worker.js').then(function (registration: ServiceWorkerRegistration): void {
		console.log('ServiceWorker registration successful with scope: ', registration.scope);
	}).catch(function (err: Error): void {
		console.log('ServiceWorker registration failed: ', err);
	});
}