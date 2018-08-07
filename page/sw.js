const staticCacheName = 'restaurant-static-v5';
const imgsCacheName = 'restaurant-imgs';
const allCaches = [staticCacheName, imgsCacheName];

self.addEventListener('install', (event) => {
    var urlsToCache = [
        '/',
        'restaurant.html',
        'js/main.js',
        'js/restaurant_info.js',
        'js/dbhelper.js',
        'js/idb.js',
        'js/toastr.min.js',
        'js/jquery-3.3.1.min.js',
        // 'data/restaurants.json',
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

        // Use .endsWith('.html') to cache any page
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

function serveFromCache(request, cacheName, storageUrl) {

    // Return images/files from cache or 
    // get them from network and store them in cache before returning them
    return caches.open(cacheName)
        .then(cache => {
            return cache.match(storageUrl).then(response => {
                if (response) {
                    return response;
                }
                return fetch(request).then(networkResponse => {
                    cache.put(storageUrl, networkResponse.clone());
                    return networkResponse;
                });
            })
        });
}
