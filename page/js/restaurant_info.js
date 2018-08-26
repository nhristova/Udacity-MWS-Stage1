// import { DBHelper } from './dbhelper.js';
import { WorkerRegister } from './workerRegister.js';
import { shared } from './shared.js';

/* globals GoogleMapsLoader, google, DBHelper */

export function RestaurantService() {

    const self = this;
    this.restaurant;
    this.map;
    this.modal;

    window.onload = () => {

        // TODO Consider replacing callbacks with promises
        self.fetchRestaurantFromURL((error, restaurant) => {
            if (error) { // Got an error!
                console.error(error);
            } else {
                fillBreadcrumb();
                fillRestaurantHTML();
                // TODO fill restaurant reviews separately from and after loading general info
                // Delay loading of new review modal html until user clicks on 'Add review' button
                self.modal = document.getElementById('review-modal');
                document.getElementById('open-modal').addEventListener('click', openNewReviewModal);

                shared.initStarFav(document.getElementById('star-fav-' + self.restaurant.id));

                GoogleMapsLoader.KEY = 'AIzaSyD7KC8kdJmtPQc1QOG9QFJP-I9Nd-i5eC0';
                GoogleMapsLoader.LIBRARIES = ['places'];
                GoogleMapsLoader.load(this.initMap);

                new WorkerRegister();
            }
        });
    };

    /** Initialize Google map, not called from HTML any more, but when DOMContentLoaded. */
    this.initMap = () => {
        self.map = new google.maps.Map(document.getElementById('map'), {
            zoom: 16,
            center: self.restaurant.latlng,
            scrollwheel: false
        });

        DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    };

    /** Get current restaurant from page URL. */
    this.fetchRestaurantFromURL = (callback) => {
        if (self.restaurant) { // restaurant already fetched!
            callback(null, self.restaurant);
            // TODO Update reviews
            return;
        }
        const id = getParameterByName('id');
        if (!id) { // no id found in URL
            const error = 'No restaurant id in URL';
            callback(error, null);
        } else {
            DBHelper.fetchRestaurantById(id, (error, restaurant) => {
                if (!restaurant) {
                    console.error(error);
                    return;
                }
                self.restaurant = restaurant;
                callback(null, restaurant);
            });
        }
    };

    /** Create restaurant HTML and add it to the webpage */
    const fillRestaurantHTML = (restaurant = this.restaurant) => {
        const name = document.getElementById('restaurant-name');
        name.innerHTML = restaurant.name;

        const address = document.getElementById('restaurant-address');
        address.innerHTML = restaurant.address;
        address.setAttribute('aria-label', 'Address: ' + restaurant.address + '.');

        const starRef = document.getElementById('star-fav');
        starRef.id += '-' + restaurant.id;
        if (restaurant.is_favorite === true || restaurant.is_favorite === 'true') {
            starRef.setAttribute('checked', true);
            starRef.classList.add('star-checked');
        }

        const imgSrc = DBHelper.imageUrlForRestaurant(restaurant);

        const image = document.getElementById('restaurant-img');
        image.className = 'restaurant-img';
        image.alt = restaurant.description;
        image.src = imgSrc;
        image.srcset = `${imgSrc.replace('.jpg', '_small.jpg')} 400w, ${imgSrc} 800w`;
        image.sizes = '(min-width: 481px) 50vw, 100vw';

        const cuisine = document.getElementById('restaurant-cuisine');
        cuisine.innerHTML = restaurant.cuisine_type;
        cuisine.setAttribute('aria-label', 'Cuisine: ' + restaurant.cuisine_type + '.');

        // fill operating hours
        if (restaurant.operating_hours) {
            fillRestaurantHoursHTML();
        }
        // fill reviews
        fillReviewsHTML();
    };

    /** Create restaurant operating hours HTML table and add it to the webpage. */
    const fillRestaurantHoursHTML = (operatingHours = this.restaurant.operating_hours) => {
        const hours = document.getElementById('restaurant-hours');
        // TODO: Test if screen reader reads the contents of the restaurant hours
        hours.setAttribute('aria-label', 'Restaurant hours');
        for (let key in operatingHours) {
            const row = document.createElement('tr');

            const day = document.createElement('td');
            day.innerHTML = key;
            row.appendChild(day);

            const time = document.createElement('td');
            time.innerHTML = operatingHours[key];
            row.appendChild(time);

            hours.appendChild(row);
        }
    };

    /** Create all reviews HTML and add them to the webpage. */
    const fillReviewsHTML = (reviews = this.restaurant.reviews) => {
        const container = document.getElementById('reviews-container');
        const title = document.createElement('h3');
        title.innerHTML = 'Reviews';
        container.appendChild(title);

        if (!reviews || reviews.length === 0) {
            const noReviews = document.createElement('p');
            noReviews.innerHTML = 'No reviews yet!';
            container.appendChild(noReviews);
            return;
        }
        const ul = document.getElementById('reviews-list');
        reviews.forEach(review => {
            ul.appendChild(createReviewHTML(review));
        });
        container.appendChild(ul);
    };

    /** Create review HTML and add it to the webpage. */
    const createReviewHTML = (review) => {
        const li = document.createElement('li');
        const name = document.createElement('p');
        name.innerHTML = review.name;
        li.appendChild(name);

        const date = document.createElement('p');
        const dateValue = new Date(review.createdAt);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        date.innerHTML = dateValue.toLocaleDateString('en-US', options);
        li.appendChild(date);

        const rating = document.createElement('p');
        rating.innerHTML = `Rating: ${review.rating}`;
        li.appendChild(rating);

        const comments = document.createElement('p');
        comments.innerHTML = review.comments;
        li.appendChild(comments);

        return li;
    };

    /** Add restaurant name to the breadcrumb navigation menu */
    const fillBreadcrumb = (restaurant = this.restaurant) => {
        const breadcrumb = document.getElementById('breadcrumb');
        const li = document.createElement('li');
        li.setAttribute('aria-current', 'page');
        li.innerHTML = restaurant.name;
        breadcrumb.appendChild(li);
    };

    /** Get a parameter by name from page URL. */
    const getParameterByName = (name, url) => {
        if (!url)
            url = window.location.href;
        name = name.replace(/[\[\]]/g, '\\$&');
        const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
            results = regex.exec(url);
        if (!results)
            return null;
        if (!results[2])
            return '';
        return decodeURIComponent(results[2].replace(/\+/g, ' '));
    };

    const fetchModalHTML = function() {

        return fetch('review-modal.html')
            .then(response => response.text())
            .catch(error => console.log('restaurant_info fetchModalHTML Error fetching review-modal from network', error));
    };

    const fillNewReviewHTML = function(review) {
        const ul = document.getElementById('reviews-list');
        ul.insertAdjacentElement('afterbegin', createReviewHTML(review));
    };

    /* Based on https://www.w3schools.com/howto/howto_css_modals.asp */
    const openNewReviewModal = function(restaurant = self.restaurant, modal = self.modal) {
        // Only init modal dialog once
        if (modal.hasChildNodes()) {
            toggleElement(modal);
            return;
        }

        fetchModalHTML()
            .then(text => {
                modal.innerHTML = text;

                document.getElementById('restaurant_id').value = restaurant.id;
                document.getElementById('modal-title').innerHTML += restaurant.name;

                toggleElement(modal);

                // When the user clicks anywhere outside of the modal content, on the x, or cancel button, close it
                const focusedElementBeforeModal = document.activeElement;
                modal.addEventListener('click', (event) => {
                    if (event.target === modal || event.target.id === 'cancel' || event.target.id === 'close') {
                        toggleElement(modal);
                        document.forms['new-review-form'].reset();
                        focusedElementBeforeModal.focus();
                    }
                });

                trapFocus(focusedElementBeforeModal);

                document.forms['new-review-form'].onsubmit = function(event) {
                    event.preventDefault();
                    submitReview(event.target);
                };
            })
            .catch(error => console.log('restaurant_info initNewReviewModal Error', error));
    };

    const trapFocus = function(focusedElementBeforeModal, modal = self.modal) {
        // Save current focus from part 2 of the MWS nanodegree
        var focusableElementsString = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]';
        var focusableElements = modal.querySelectorAll(focusableElementsString);
        // Convert NodeList to Array
        focusableElements = Array.prototype.slice.call(focusableElements);

        var firstTabStop = focusableElements[0];
        var lastTabStop = focusableElements[focusableElements.length - 1];

        modal.addEventListener('keydown', (event) => {
            // Check for SHIFT + TAB key press
            if (event.shiftKey && event.keyCode === 9 && document.activeElement === firstTabStop) {
                event.preventDefault();
                lastTabStop.focus();
            }
            // TAB key pressed
            if (event.keyCode === 9 && !event.shiftKey && document.activeElement === lastTabStop) {
                event.preventDefault();
                firstTabStop.focus();
            }

            // Make Escape key close
            if (event.keyCode === 27) {
                toggleElement(modal);
                focusedElementBeforeModal.focus();
            }
        });
    };

    const toggleElement = function(el) {
        el.classList.contains('isHidden') ? el.classList.remove('isHidden') : el.classList.add('isHidden');
    };

    const submitReview = function(form) {

        // Don't use FormData, works only with strings
        // TODO VALIDATE VALUES!

        let draftReview = {};
        draftReview[form.restaurant_id.name] = parseInt(form.restaurant_id.value);
        draftReview[form.name.name] = form.name.value;
        draftReview[form.rating.name] = parseInt(form.rating.value);
        draftReview[form.review.name] = form.review.value;
        draftReview['createdAt'] = new Date();

        DBHelper.saveNewReview(draftReview)
            .then(result => {
                // Display the newly saved review
                fillNewReviewHTML(result);
                // Close and reset the modal
                toggleElement(self.modal);
                document.forms['new-review-form'].reset();
            });

    };

}
