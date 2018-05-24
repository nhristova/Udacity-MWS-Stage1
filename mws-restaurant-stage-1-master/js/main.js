let restaurants,
    neighborhoods,
    cuisines
var map
var markers = []

/*globals toastr*/


/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
    fetchNeighborhoods();
    fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
    DBHelper.fetchNeighborhoods((error, neighborhoods) => {
        if (error) { // Got an error
            console.error(error);
        } else {
            self.neighborhoods = neighborhoods;
            fillNeighborhoodsHTML();
        }
    });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
    const select = document.getElementById('neighborhoods-select');
    neighborhoods.forEach(neighborhood => {
        const option = document.createElement('option');
        option.innerHTML = neighborhood;
        option.value = neighborhood;
        select.append(option);
    });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
    DBHelper.fetchCuisines((error, cuisines) => {
        if (error) { // Got an error!
            console.error(error);
        } else {
            self.cuisines = cuisines;
            fillCuisinesHTML();
        }
    });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
    const select = document.getElementById('cuisines-select');

    cuisines.forEach(cuisine => {
        const option = document.createElement('option');
        option.innerHTML = cuisine;
        option.value = cuisine;
        select.append(option);
    });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
    let loc = {
        lat: 40.722216,
        lng: -73.987501
    };
    self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        center: loc,
        scrollwheel: false
    });
    updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
    const cSelect = document.getElementById('cuisines-select');
    const nSelect = document.getElementById('neighborhoods-select');

    const cIndex = cSelect.selectedIndex;
    const nIndex = nSelect.selectedIndex;

    const cuisine = cSelect[cIndex].value;
    const neighborhood = nSelect[nIndex].value;

    DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
        if (error) { // Got an error!
            console.error(error);
        } else {
            resetRestaurants(restaurants);
            fillRestaurantsHTML();
        }
    })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
    // Remove all restaurants
    self.restaurants = [];
    const ul = document.getElementById('restaurants-list');
    ul.innerHTML = '';

    // Remove all map markers
    self.markers.forEach(m => m.setMap(null));
    self.markers = [];
    self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
    const ul = document.getElementById('restaurants-list');
    restaurants.forEach(restaurant => {
        ul.append(createRestaurantHTML(restaurant));
    });
    addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
    const li = document.createElement('li');
    const imgSrc = DBHelper.imageUrlForRestaurant(restaurant);

    const image = document.createElement('img');
    image.className = 'restaurant-img';
    image.alt = "";
    image.src = imgSrc;
    image.srcset = `${imgSrc.replace('.jpg', '_small.jpg')} 400w, ${imgSrc} 800w`;
    image.sizes = "(min-width: 480px) 40vw, (min-width: 721px) 29vw, (min-width: 1000px) 22vw";
    li.append(image);

    const name = document.createElement('h1');
    name.innerHTML = restaurant.name;
    li.append(name);

    const neighborhood = document.createElement('p');
    neighborhood.classList.add("neighborhood");
    neighborhood.innerHTML = restaurant.neighborhood;
    li.append(neighborhood);

    const address = document.createElement('p');
    address.innerHTML = restaurant.address;
    li.append(address);

    const more = document.createElement('a');
    more.innerHTML = 'View Details';
    more.href = DBHelper.urlForRestaurant(restaurant);
    /* The fullstop in the beginning of the aria-label is 
    for the screen reader to make a pause after reading the address */
    more.setAttribute('aria-label', '. Details for restaurant: ' + restaurant.name);
    li.append(more);

    return li;
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
    restaurants.forEach(restaurant => {
        // Add marker to the map
        const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
        google.maps.event.addListener(marker, 'click', () => {
            window.location.href = marker.url
        });
        self.markers.push(marker);
    });
}

window.onload = (ev) => {
    console.log('window loaded');
    toastr.warning('I am toasting');
    registerServiceWorker();
};

function registerServiceWorker() {
    // Check support for serviceWorker
    // skip SW functions if no support
    if (!navigator.serviceWorker) {
        console.log('Browser does not support serviceWorker');
        return;
    }

    navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
            console.log('SW registered');

            // If there is no controller, this page was NOT loaded via a SW
            // so this is the latest version, exit
            if (!navigator.serviceWorker.controller) {
                console.log('Latest version');
                return;
            }

            // Updated SW waiting, call function to show toast message
            if (reg.waiting) {
                console.log('SW waiting');
                updateReady(reg.waiting);
                return;
            }

            // Updated SW is installing, track progress 
            // and call updateReady when it is installed
            if (reg.installing) {
                console.log('SW installing');
                trackInstalling(reg);
                return;
            }

            // Listen for incoming SW and track them
            reg.addEventListener('updatefound', () => {
                console.log('Update found');
                trackInstalling(reg);
            });
        })
        .catch((err) => console.log('Error registering serviceWorker', err));

    // Ensure refresh is only called once.
    // This works around a bug in "force update on reload".
    let refreshing;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        window.location.reload();
        refreshing = true;
    });
}

function trackInstalling(worker) {
    console.log('Track installing');
    worker.addEventListener('statechange', () => {
        console.log('State change');
        if (worker.state == 'installed') {
            updateReady(worker);
        };
    });
}

function updateReady(worker) {
    toastr.error('New version available');

    // get reply from toastr
}
