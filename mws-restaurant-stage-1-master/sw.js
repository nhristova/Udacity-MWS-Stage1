const staticCacheName = 'restaurant-static-v8';
const imgsCacheName = 'restaurant-imgs';
const allCaches = [staticCacheName, imgsCacheName];

self.addEventListener('install', (event) => {
    var urlsToCache = [
        '/',
        'js/main.js',
        'js/dbhelper.js',
        'js/idb.js',
        'js/toastr.min.js',
        'js/jquery-3.3.1.min.js',
        'css/styles.css',
        'https://fonts.googleapis.com/css?family=Roboto:300,400s'
    ];

    event.waitUntil(
        caches.open(staticCacheName)
        .then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', (event) => {
    // console.log('Fetching: ', event.request.url);

    const requestUrl = new URL(event.request.url);

    // why is this needed??
    if (requestUrl.origin === location.origin) {

    }

    if (requestUrl.pathname.startsWith('/img/')) {
        event.respondWith(serveImage(event.request));
        return;
    }

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
        console.log('SWITCHING TO NEW SW');
        self.skipWaiting();
    }
});

function serveImage(request) {
    var storageUrl = request.url.replace(/_*[a-z]*\.jpg/, '');

    return caches.open(imgsCacheName)
        .then(cache => {
            return cache.match(storageUrl).then(response => {
                if (response) { return response; }
                return fetch(request).then(networkResponse => {
                    cache.put(storageUrl, networkResponse.clone());
                    return networkResponse;
                });
            })
        });
}
