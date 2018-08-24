/* globals google, idb */

/**
 * Common database helper functions.
 */
// TODO remove if not used
let lastUpdate = new Date(2000, 1, 1);
let savingRestaurants = false;


class DBHelper {

    /** Database URL.
     * Change this to restaurants.json file location on your server.*/
    static get DATABASE_URL() {
        const port = 1337; // Change this to your server port
        return `http://localhost:${port}/`;
    }

    /** Fetch all restaurants or one restaurant if id passed. */
    // TODO: Rewrite these to use promises instead of callbacks
    static getRestaurants(callback) {
        // If there are restaurants in IDB, show them
        DBHelper.loadIdbStore('restaurants')
            .then(restaurantsIdb => {
                if (restaurantsIdb && restaurantsIdb.length) {
                    // console.log('DBHelper getRestaurants: Getting restaurants from IDB');
                    callback(null, restaurantsIdb);
                    return false;
                }
                // Restaurants were not found in IDB, return true to fetch from network
                return true;
            })
            .then(fetchFromNetwork => fetchFromNetwork && DBHelper.fetchFromNetwork('restaurants'))
            .then(restaurants => restaurants && callback(null, restaurants))
            .catch(error => callback(error, null));
    }

    // TODO Compplete
    static getOneRestaurant(id) {
        return DBHelper.loadIdbStore('restaurants', id)
            .then(restaurant => {
                if (restaurant) {
                    return Promise.resolve(restaurant);
                }
                return DBHelper.fetchFromNetwork('restaurants', `/${id}`);
            })
            .then(result => console.log(result))
            .catch(error => console.log('Error getting one restaurant', error));
    }

    static fetchFromNetwork(path, query = '') {
        const url = DBHelper.DATABASE_URL + path + query;

        return fetch(url)
            .then(response => response.json())
            .then(data => {
                DBHelper.saveIdbStore(path, data);
                return data;
            })
            .catch(error => console.log('DBHelper Error fetching from network', path, query, error));
    }

    /** Fetch a restaurant by its ID.*/
    static fetchRestaurantById(id, callback) {
        // fetch all restaurants with proper error handling.
        DBHelper.getRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                const restaurant = restaurants.find(r => r.id == id);
                if (restaurant && !restaurant.reviews) {
                    // Get reviews
                    DBHelper.getReviewsById(restaurant.id)
                        .then(result => {
                            restaurant.reviews = result;
                            callback(null, restaurant);
                        });
                } else { // Restaurant does not exist in the database
                    callback('Restaurant does not exist', null);
                }
            }
        });
    }

    /** Fetch a review by its ID - load from idb quickly; if offline, add pending entries;
     * if no idb data, load from network. Finally, filter the reviews per restaurant because
     * the idb stores return all entries (fetching returns only for provided restaurant id).
     */
    static getReviewsById(restaurantId) {
        return DBHelper.loadIdbStore('reviews')
            .then(reviewsIdb => {
                if (reviewsIdb.length > 0 && navigator.onLine) {
                    // Call network fetch to add new entries to the reviews idb store
                    DBHelper.fetchFromNetwork('reviews', `/?restaurant_id=${restaurantId}`);
                    return reviewsIdb;
                }
                // Add pending outbox entries
                if (!navigator.onLine) {
                    return DBHelper.loadIdbStore('outbox')
                        .then(pending => reviewsIdb.concat(pending));
                }
                //return Promise.resolve(reviewsIdb);
                // No reviews in idb or outbox, get from network
                return DBHelper.fetchFromNetwork('reviews', `/?restaurant_id=${restaurantId}`);
            })
            .then(reviews => reviews.filter(review => review.restaurant_id === restaurantId))
            .catch(error => console.log('Error getting reviews', error));
    }

    /** If online, posts new review to network, and saves it in 'reviews' store of IndexedDB.
     * If offline, saves pending review in 'outbox' store of IndexedDB.
     */
    static saveNewReview(draftReview) {
        if (navigator.onLine) {
            return DBHelper.saveToNetwork('reviews', 'POST', draftReview)
                .then(result => {
                    console.log('DBHelper saveNewReview: review saved to network', draftReview);
                    if (result) {
                        DBHelper.saveIdbStore('reviews', result);
                    }
                    return result;
                })
                .catch(error => console.log('Error saving review', error));
        }

        return DBHelper.saveIdbStore('outbox', draftReview)
            .then(result => {
                // TODO: Check if saveIdbStore can return some value
                console.log('DBHelper saveNewReview: offline review saved to outbox', result, draftReview);
                return draftReview;
            })
            .catch(error => console.log('Error saving review to outbox', error));
    }

    static saveToNetwork(path, method, data) {
        const url = DBHelper.DATABASE_URL + path;
        const init = {
            method: method,
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            },
            // PUT requests for favourites should be without body, otherwise server throws a parsing error
            body: JSON.stringify(data)
        };

        return fetch(url, init)
            .then(response => response.json())
            .then(dataJson => {
                // console.log('DBHelper saveToNetwork: response ', dataJson);
                return dataJson;
            })
            .catch(error => console.error('Error saving reviews', error));
    }

    /** Add or remove favourite */
    static toggleFavourite(rId, isFav) {
        DBHelper.loadIdbStore('restaurants', rId)
            .then(restaurant => {
                restaurant.is_favorite = isFav;
                return restaurant;
            })
            .then(r => DBHelper.saveIdbStore('restaurants', r));

        DBHelper.saveToNetwork(`restaurants/${rId}/?is_favorite=${isFav}`, 'PUT');
    }

    /** Fetch restaurants by a cuisine type with proper error handling. */
    static fetchRestaurantByCuisine(cuisine, callback) {
        // Fetch all restaurants  with proper error handling
        DBHelper.getRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Filter restaurants to have only given cuisine type
                const results = restaurants.filter(r => r.cuisine_type == cuisine);
                callback(null, results);
            }
        });
    }

    /** Fetch restaurants by a neighborhood with proper error handling. */
    static fetchRestaurantByNeighborhood(neighborhood, callback) {
        // Fetch all restaurants
        DBHelper.getRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Filter restaurants to have only given neighborhood
                const results = restaurants.filter(r => r.neighborhood == neighborhood);
                callback(null, results);
            }
        });
    }

    /** Fetch restaurants by a cuisine and a neighborhood with proper error handling. */
    static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
        // Fetch all restaurants
        DBHelper.getRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                let results = restaurants;
                if (cuisine != 'all') { // filter by cuisine
                    results = results.filter(r => r.cuisine_type == cuisine);
                }
                if (neighborhood != 'all') { // filter by neighborhood
                    results = results.filter(r => r.neighborhood == neighborhood);
                }
                callback(null, results);
            }
        });
    }

    /** Fetch all neighborhoods with proper error handling. */
    static fetchNeighborhoods(callback) {
        // Fetch all restaurants
        DBHelper.getRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Get all neighborhoods from all restaurants
                const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
                // Remove duplicates from neighborhoods
                const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
                callback(null, uniqueNeighborhoods);
            }
        });
    }

    /** Fetch all cuisines with proper error handling. */
    static fetchCuisines(callback) {
        // Fetch all restaurants
        DBHelper.getRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Get all cuisines from all restaurants
                const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
                // Remove duplicates from cuisines
                const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
                callback(null, uniqueCuisines);
            }
        });
    }

    /** Restaurant page URL. */
    static urlForRestaurant(restaurant) {
        return (`./restaurant.html?id=${restaurant.id}`);
    }

    /** Restaurant image URL. */
    static imageUrlForRestaurant(restaurant) {
        return (`/img/${restaurant.id}.jpg`);
    }

    /** Map marker for a restaurant. */
    static mapMarkerForRestaurant(restaurant, map) {
        const marker = new google.maps.Marker({
            position: restaurant.latlng,
            title: restaurant.name,
            url: DBHelper.urlForRestaurant(restaurant),
            map: map,
            animation: google.maps.Animation.DROP
        });
        return marker;
    }

    // change to static property 
    // rename to dbPromise
    static openDatabase() {
        // there is an error when calling this from SW
        // serviceWorker is undefined
        // TODO: find out why
        // if (!navigator.serviceWorker) {
        //     // resolve or reject??
        //     return Promise.resolve();
        // }

        // returns a promise
        // upgradeDb callback only called if `version` is greater 
        // than the version last opened or 
        // when the browser has not heard of this database before
        return idb.open('mws-stage2', 2, (upgradeDb) => {
            console.log('openDatabase upgradeDb called', upgradeDb);
            // Trying to create a store twice will throw an error
            // make sure the version is updated 
            // so that it skips already created store
            switch (upgradeDb.oldVersion) {
                case 0:
                    upgradeDb.createObjectStore('restaurants', { keyPath: 'id' });
                    upgradeDb.createObjectStore('reviews', { keyPath: 'id' });
                case 1:
                    upgradeDb.createObjectStore('outbox', { keyPath: 'tempId', autoIncrement: true });
            }
        });
    }

    /** Retrieves all items or one item if id/key is passed */
    static loadIdbStore(storeName, itemId) {
        return DBHelper.openDatabase()
            .then(db => {
                if (!db) return;

                const tx = db.transaction(storeName);
                const store = tx.objectStore(storeName);

                if (itemId) {
                    return store.get(itemId);
                }

                return store.getAll();
            });
    }

    /** Saves/updates one or more items */
    static saveIdbStore(storeName, data) {
        // accept array or single element
        data = [].concat(data || []);

        // check if it's ok to call openDatabase twice
        return DBHelper.openDatabase()
            .then(db => {
                const tx = db.transaction(storeName, 'readwrite');
                const store = tx.objectStore(storeName);

                // TODO: Handle update to existing items
                data.forEach(item => store.put(item));

                return tx.complete;
            }).then(() => {
                // what was this for?
                savingRestaurants = false;
                console.log(`DBHelper saveIdbStore: Data saved to IDB, store: ${storeName}`);
            });
    }

    static clearIdbStore(storeName) {
        return DBHelper.openDatabase()
            .then(db => {
                const tx = db.transaction(storeName, 'readwrite');
                tx.objectStore(storeName).clear();

                // returns nothing?
                return tx.complete;
            })
            .then(result => console.log('DBHelper clearIdbStore: done'));
    }

    /** Loads outbox from IndexedDB, 
     * posts each pending item to network,
     * saves in the 'reviews' store of IndexedDb,
     * and finally empties the outbox. */
    static processOutbox() {
        // console.log('DBHelper processOutbox: starting');
        if (!navigator.onLine) {
            console.log('DBHelper processOutbox: No internet, rejecting');
            return Promise.reject('DBHelper processOutbox: No internet, try again later');
        }

        return DBHelper.loadIdbStore('outbox')
            .then(pendingReviews => {
                // console.log('DBHelper processOutbox: mapping pending reviews');
                pendingReviews.map(pReview => DBHelper.saveNewReview(pReview));
            })
            .then(() => {
                // console.log('DBHelper processOutbox: cleaning outbox');
                DBHelper.clearIdbStore('outbox');
                return Promise.resolve('DBHelper processOutbox: Outbox processed successfully');
            })
            .catch(error => console.log('DBHelper processOutbox error: ', error));
    }
}
