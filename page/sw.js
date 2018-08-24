//import { DBHelper } from './js/dbhelper.js';
// self.importScripts() TODO: Check if this works?? 
importScripts('./js/idb.js');
importScripts('./js/dbhelper.js');

/* globals DBHelper */

const staticCacheName = 'restaurant-static-v5';
const imgsCacheName = 'restaurant-imgs';
const allCaches = [staticCacheName, imgsCacheName];

self.addEventListener('install', (event) => {
    // TODO: uncomment for prod
    const urlsToCache = [
        '/',
        'js/main.js',
        'js/restaurant_info.js',
        'js/dbhelper.js',
        'js/idb.js',
        'js/Google.min.js',
        'css/styles.css',
        'css/home.css',
        'css/responsive-home.css',
        'css/restaurant.css',
        'css/responsive-restaurant.css',
        'https://fonts.googleapis.com/css?family=Roboto:300,400s'
    ];

    event.waitUntil(
        caches.open(staticCacheName)
            .then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);
    let storageUrl = '';

    if (requestUrl.origin === location.origin) {
        if (requestUrl.pathname.startsWith('/img/')) {

            // Remove image size info, store only one of each image, regardless of size
            storageUrl = event.request.url.replace(/_*[a-z]*\.jpg/, '');

            event.respondWith(serveFromCache(event.request, imgsCacheName, storageUrl));
            //event.respondWith(serveImage(event.request));
            return;
        }

        // TODO: Uncomment for prod
        // Use .contains('.html') to cache any page
        if (requestUrl.pathname.startsWith('/restaurant')) {
            storageUrl = requestUrl.pathname.substr(1);

            event.respondWith(serveFromCache(event.request, staticCacheName, storageUrl));
            return;
        }
    }

    event.respondWith(
        // Check for the requested resource in cache
        caches.match(event.request)
            .then((response) => {
                // If cache entry found, return it
                if (response) {
                    return response;
                }
                // If not cached, get resource from network
                return fetch(event.request);
            })
            .then((response) => {
                if (response.status === 404) {
                    return new Response('Not found');
                }
                return response;
            })
            .catch((error) => {
                console.log('SW ERROR: ', error);
                return new Response('Connection error');
            })
    );
});

// SW is being updated, need to delete old cache versions
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            Promise.all(
                cacheNames
                    .filter((name) => name.startsWith('restaurant-') && !allCaches.includes(name))
                    .map(name => caches.delete(name))
            );
        })
    );
});

// Listen for messages sent from user clicking on new version message btns
self.addEventListener('message', (event) => {
    // Event.data should contain the reply from the user to update
    if (event.data.action === 'skipWaiting') {
        console.log('SWITCHING TO NEW SW');
        self.skipWaiting();
    }
});

// Listen for sync event attached to sw.ready & windonw.online in workerRegister.js
self.addEventListener('sync', (event) => {
    // console.log('SW SYNC event fired: Get stuff from outbox and push it to network. Event tag: ', event.tag);
    if(event.tag === 'sync-reviews-on-online'){
        // console.log('SW SYNC Triggering sync on connection restore');
        event.waitUntil(
            DBHelper.processOutbox()
                .then(result => console.log('SW SYNC processOutbox on online completed, result: ', result))
                .catch(error => console.log('SW SYNC online error: ', error))
        );
    }

    if(event.tag === 'sync-reviews-on-reload') {
        // console.log('SW SYNC Triggering sync on reload');
        event.waitUntil(
            DBHelper.processOutbox()
                .then(result => console.log('SW SYNC processOutbox on-reload completed, result: ', result))
                .catch(error => console.log('SW SYNC reload error: ', error))
        );
    }
});

/** Return images/files from cache or 
 * get them from network and 
 * store them in cache before returning them
 */
function serveFromCache(request, cacheName, storageUrl) {
    return caches.open(cacheName)
        .then(cache => cache.match(storageUrl)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(request).then(networkResponse => {
                    cache.put(storageUrl, networkResponse.clone());
                    return networkResponse;
                });
            })
        );
}
