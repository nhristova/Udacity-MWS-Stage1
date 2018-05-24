const staticCacheName = 'restaurant-static-v7';
const imgsCacheName = 'restaurant-imgs';
const allCaches = [staticCacheName, imgsCacheName];

self.addEventListener('install', (event) => {
    var urlsToCache = [
        // '/',
        // 'js/main.js',
        'css/styles.css',
        'https://fonts.googleapis.com/css?family=Roboto:300,400s'
    ];

    event.waitUntil(
        caches.open(staticCacheName)
        .then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', (event) => {
    // console.log('Fetching stuff', event.request);

    event.respondWith(
        // check for the requested resource in cache
        caches.match(event.request)
        .then((response) => {
            // if cache entry found, return it
            if (response) {
                // console.log('Getting things from cache');    
                return response;
            }
            // if not cached, get resource from network
            return fetch(event.request);
        })
        .then((response) => {
            if (response.status === 404) {
                return new Response('Not found');
            }
            // process response eg: response.json()
            return response;
        })
        .catch((error) => {
            console.log('ERROR: ', error);
            return new Response('Connection error');
        })
    )
});

// SW is being updated, need to delete old cache
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            Promise.all(
                cacheNames
                .filter((name) => name.startsWith('restaurant-') && !allCaches.includes(name))
                .map(name => caches.delete(name))
            );
        })
    )
});

self.addEventListener('message', (event) => {
    // Event.data should contain the reply from the user to update 
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});
