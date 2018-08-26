// import { DBHelper } from './dbhelper.js';
import { WorkerRegister } from './workerRegister.js';
import { shared } from './shared.js';

/* globals GoogleMapsLoader, google, DBHelper */

let restaurants,
    neighborhoods,
    cuisines;
let map;
let markers = [];


/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
    fetchNeighborhoods();
    fetchCuisines();
    updateRestaurants();
    GoogleMapsLoader.KEY = 'AIzaSyD7KC8kdJmtPQc1QOG9QFJP-I9Nd-i5eC0';
    GoogleMapsLoader.LIBRARIES = ['places'];
    GoogleMapsLoader.load(initMap);
});

window.onload = () => {
    addMarkersToMap();
    shared.initStarFav(document.getElementById('restaurants-list'));

    new WorkerRegister();

};

/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchNeighborhoods = () => {
    DBHelper.fetchNeighborhoods((error, neighborhoods) => {
        if (error) { // Got an error
            console.error(error);
        } else {
            self.neighborhoods = neighborhoods;
            fillNeighborhoodsHTML();
        }
    });
};

/**
 * Set neighborhoods HTML.
 */
const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
    const select = document.getElementById('neighborhoods-select');
    select.addEventListener('change', updateRestaurants);

    neighborhoods.forEach(neighborhood => {
        const option = document.createElement('option');
        option.innerHTML = neighborhood;
        option.value = neighborhood;
        select.append(option);
    });
};

/**
 * Fetch all cuisines and set their HTML.
 */
const fetchCuisines = () => {
    DBHelper.fetchCuisines((error, cuisines) => {
        if (error) { // Got an error!
            console.error(error);
        } else {
            self.cuisines = cuisines;
            fillCuisinesHTML();
        }
    });
};

/**
 * Set cuisines HTML.
 */
const fillCuisinesHTML = (cuisines = self.cuisines) => {
    const select = document.getElementById('cuisines-select');
    select.addEventListener('change', updateRestaurants);

    cuisines.forEach(cuisine => {
        const option = document.createElement('option');
        option.innerHTML = cuisine;
        option.value = cuisine;
        select.append(option);
    });
};

/**
 * Initialize Google map.
 */
const initMap = () => {
    let loc = {
        lat: 40.722216,
        lng: -73.987501
    };
    self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        center: loc,
        scrollwheel: false
    });
    //updateRestaurants();
};

/**
 * Update page and map for current restaurants.
 */
const updateRestaurants = () => {
    const cSelect = document.getElementById('cuisines-select');
    const nSelect = document.getElementById('neighborhoods-select');

    const cIndex = cSelect.selectedIndex;
    const nIndex = nSelect.selectedIndex;

    const cuisine = cSelect[cIndex].value;
    const neighborhood = nSelect[nIndex].value;

    DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
        if (error) { // Got an error!
            console.log(error);
        } else {
            resetRestaurants(restaurants);
            fillRestaurantsHTML();
            // addMarkersToMap();
        }
    });
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
const resetRestaurants = (restaurants) => {
    // Remove all restaurants
    self.restaurants = [];
    const ul = document.getElementById('restaurants-list');
    ul.innerHTML = '';

    self.restaurants = restaurants;
    // Remove all map markers
    if (markers) {
        markers.forEach(m => m.setMap(null));
        markers = [];
    }
};

/**
 * Create all restaurants HTML and add them to the web-page.
 */
const fillRestaurantsHTML = (restaurants = self.restaurants) => {
    const ul = document.getElementById('restaurants-list');
    restaurants.forEach(restaurant => {
        ul.append(createRestaurantHTML(restaurant));
    });
    //addMarkersToMap();
};

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = (restaurant) => {
    const li = document.createElement('li');
    const imgSrc = DBHelper.imageUrlForRestaurant(restaurant);

    const star = document.createElement('span');
    star.id = 'star-fav-' + restaurant.id;
    star.classList.add('star', 'star-fav');
    star.setAttribute('role', 'checkbox');
    star.setAttribute('title', 'Mark restaurant as favourite');
    star.setAttribute('tabindex', 0);
    star.innerHTML = '★';
    const isFav = restaurant.is_favorite === true || restaurant.is_favorite === 'true';
    if(isFav){
        star.setAttribute('checked', isFav);
        star.classList.add('star-checked');
    }    
    li.append(star);

    const image = document.createElement('img');
    image.className = 'restaurant-img';
    image.alt = restaurant.description;
    image.src = imgSrc;
    image.srcset = `${imgSrc.replace('.jpg', '_small.jpg')} 400w, ${imgSrc} 800w`;
    image.sizes = '(min-width: 480px) 40vw, (min-width: 721px) 29vw, (min-width: 1000px) 22vw';
    li.append(image);

    const name = document.createElement('h2');
    name.innerHTML = restaurant.name;
    li.append(name);

    const neighborhood = document.createElement('p');
    neighborhood.classList.add('neighborhood');
    neighborhood.innerHTML = restaurant.neighborhood;
    li.append(neighborhood);

    const address = document.createElement('p');
    address.innerHTML = restaurant.address;
    li.append(address);

    const more = document.createElement('a');
    more.innerHTML = 'View Details';
    more.href = DBHelper.urlForRestaurant(restaurant);
    more.classList.add('btn', 'btn-warning');
    /* The full stop in the beginning of the aria-label is 
    for the screen reader to make a pause after reading the address */
    more.setAttribute('aria-label', '. Details for restaurant: ' + restaurant.name);
    li.append(more);

    return li;
};

/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants = self.restaurants) => {
    restaurants.forEach(restaurant => {
        // Add marker to the map
        const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
        google.maps.event.addListener(marker, 'click', () => {
            window.location.href = marker.url;
        });
        markers.push(marker);
    });
};




