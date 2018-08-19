import { idb } from './idb.js';

/**
 * Common database helper functions.
 */
let lastUpdate = new Date(2000, 1, 1);
let savingRestaurants = false;


/* globals google */
export class DBHelper {

    /** Database URL.
     * Change this to restaurants.json file location on your server.*/
    static get DATABASE_URL() {
        const port = 1337; // Change this to your server port
        return `http://localhost:${port}/`;
    }

    /** Fetch all restaurants. */
    static getRestaurants(callback) {
        // if there are restaurants in IDB, show them

        DBHelper.loadIdbStore('restaurants')
            .then(restaurantsIdb => {
                if (restaurantsIdb && restaurantsIdb.length) {
                    console.log('Getting restaurants from IDB');
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


    static fetchFromNetwork(path) {
        const url = DBHelper.DATABASE_URL + path;

        return fetch(url)
            .then(response => response.json())
            .then(data => {
                // TODO: While in dev don't save in db. Uncomment for prod
                // const updatedIndex = data.findIndex(r => {
                //     const rUpdate = new Date(r.updatedAt);
                //     if (rUpdate > lastUpdate) {
                //         lastUpdate = rUpdate;
                //     }
                //     return true;
                // });

                // TODO: Improve!!
                // if any restaurant has been updated, save them all
                // wouldn't be efficient for big data sets
                // if (updatedIndex >= 0 && !savingRestaurants) {
                //     savingRestaurants = true;
                DBHelper.saveIdbStore(path, data);
                // }

                return data;
            });
    }

    /** Fetch a restaurant by its ID.*/
    static fetchRestaurantById(id, callback) {
        // fetch all restaurants with proper error handling.
        DBHelper.getRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                const restaurant = restaurants.find(r => r.id == id);
                if (restaurant) { // Got the restaurant
                    // Get reviews
                    // TODO: improve
                    if(!restaurant.reviews){
                        DBHelper.getReviewsById(restaurant.id)
                            .then(result =>  {
                                restaurant.reviews = result;
                                callback(null, restaurant);
                            });
                    }
                } else { // Restaurant does not exist in the database
                    callback('Restaurant does not exist', null);
                }
            }
        });
    }

    /** Fetch a review by its ID.*/
    static getReviewsById(restaurantId) {
        return DBHelper.loadIdbStore('reviews')
            .then(reviewsIdb => {
                // TODO: add out-box entries here
                // consider when no idb, only out-box entries
                if(reviewsIdb.length > 0){
                    return Promise.resolve(reviewsIdb);
                }

                return DBHelper.fetchFromNetwork('reviews');
            })
            .then(reviews => reviews.filter(review => review.restaurant_id === restaurantId))
            .catch(error => console.log('Error getting reviews', error));
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

    static openDatabase() {
        if (!navigator.serviceWorker) {
            // resolve or reject??
            return Promise.resolve();
        }

        // returns a promise
        // upgradeDb callback only called if `version` is greater 
        // than the version last opened or 
        // when the browser has not heard of this database before
        return idb.open('mws-stage2', 1, (upgradeDb) => {
            console.log('openDatabase upgradeDb called', upgradeDb);
            // Trying to create a store twice will throw an error
            // make sure the version is updated 
            // so that it skips already created store
            switch (upgradeDb.oldVersion) {
            case 0:
                upgradeDb.createObjectStore('restaurants', { keyPath: 'id' });
                upgradeDb.createObjectStore('reviews', { keyPath: 'id' });
            }
        });
    }

    static loadIdbStore(storeName) {
        // check if it's ok to call openDatabase twice
        return DBHelper.openDatabase()
            .then(db => {
                if (!db) return;

                const tx = db.transaction(storeName);
                const store = tx.objectStore(storeName);

                return store.getAll();
            });
    }

    static saveIdbStore(storeName, data) {
        // check if it's ok to call openDatabase twice
        return DBHelper.openDatabase()
            .then(db => {
                const tx = db.transaction(storeName, 'readwrite');
                const store = tx.objectStore(storeName);

                data.forEach(item => store.put(item));

                return tx.complete;
            }).then(() => {
                savingRestaurants = false;
                console.log(`Data saved to IDB, store ${storeName}`);
            });
    }
}
