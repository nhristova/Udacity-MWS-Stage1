// import { DBHelper } from './dbhelper.js';
import { MainController } from './controller.js';
import { shared } from './shared.js';

/* globals GoogleMapsLoader, google, DBHelper */

export function RestaurantService() {
    
    const self = this;
    this.restaurant;
    this.map;
    
    document.addEventListener('DOMContentLoaded', (event) => {
        GoogleMapsLoader.KEY = 'AIzaSyD7KC8kdJmtPQc1QOG9QFJP-I9Nd-i5eC0';
        GoogleMapsLoader.LIBRARIES = ['places'];
        GoogleMapsLoader.load(this.initMap);
    });

    window.onload = () => {
        new MainController();
    };

    /** Initialize Google map, not called from HTML any more, but when DOMContentLoaded. */
    this.initMap = () => {
        self.fetchRestaurantFromURL((error, restaurant) => {
            if (error) { // Got an error!
                console.error(error);
            } else {
                self.map = new google.maps.Map(document.getElementById('map'), {
                    zoom: 16,
                    center: restaurant.latlng,
                    scrollwheel: false
                });
                self.fillBreadcrumb();
                DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
            }
        });
    };

    /** Get current restaurant from page URL. */
    this.fetchRestaurantFromURL = (callback) => {
        if (self.restaurant) { // restaurant already fetched!
            callback(null, self.restaurant);
            return;
        }
        const id = getParameterByName('id');
        if (!id) { // no id found in URL
            const error = 'No restaurant id in URL';
            callback(error, null);
        } else {
            DBHelper.fetchRestaurantById(id, (error, restaurant) => {
                self.restaurant = restaurant;
                if (!restaurant) {
                    console.error(error);
                    return;
                }
                fillRestaurantHTML();
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
        if(restaurant.is_favorite) {
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
        initNewReviewModal();
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

        if (!reviews) {
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
    this.fillBreadcrumb = (restaurant = this.restaurant) => {
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

    const createModalHTML = function (restaurant = self.restaurant) {
        const content = document.createElement('div');
        content.id = 'modal-content';
        content.classList.add('modal-content');

        const header = document.createElement('header');
        header.classList.add('modal-header');

        const close = document.createElement('span');
        close.innerHTML = '&times;';
        close.id = 'close';
        close.classList.add('close');
        header.appendChild(close);
        
        const heading = document.createElement('h2');
        heading.innerHTML = `New review for ${restaurant.name}`;
        header.appendChild(heading);
        content.appendChild(header);

        const body = document.createElement('div');
        body.classList.add('modal-body');
        const form = document.createElement('form');
        form.id = 'new-review-form';
        form.action ='http://localhost:1337/reviews/';
        form.method = 'POST';
        form.innerHTML = `<div>
                <input type="hidden" id="restaurant_id" name="restaurant_id" value=${restaurant.id}>
                <label for="name">Name:
                </label>
                <input id="name" name="name" type="text">
            </div>
            <div>
                <label for="rating">Rating: </label>
                <select id="rating" name="rating">
                    <option>1</option>
                    <option>2</option>
                    <option>3</option>
                    <option>4</option>
                    <option>5</option>
                </select>
            </div>
            <div id="star-rating">
                <span id="star1" class="star star-checked">★</span>
                <span id="star2" class="star star-checked">★</span>
                <span id="star3" class="star star-checked">★</span>
                <span id="star4" class="star star-empty">★</span>
                <span id="star5" class="star star-empty">★</span>
            </div>
            <div>
                <label for="review">Your comments:</label>
                <textarea id="review" name="comments" cols="30" rows="10"></textarea>
            </div>`;
        body.appendChild(form);
        content.appendChild(body);

        const footer = document.createElement('footer');
        footer.classList.add('modal-footer');

        footer.innerHTML = `<button id="submit-btn" class="btn btn-warning" form="new-review-form" type="submit">Save</button>
        <button id="cancel" class="btn btn-default">Cancel</button>`;
        content.appendChild(footer);
        
        return content;
    };
    
    const fillNewReviewHTML = function(review) {
        const ul = document.getElementById('reviews-list');
        ul.insertAdjacentElement('afterbegin', createReviewHTML(review));
    };

    /* Based on https://www.w3schools.com/howto/howto_css_modals.asp */
    const initNewReviewModal = function () {
        // Get the modal
        const modal = document.getElementById('review-modal');
        const content = createModalHTML();
        modal.appendChild(content);

        // When the user clicks anywhere outside of the modal content, on the x, or cancel button, close it
        window.addEventListener('click', function(event) {
            if (event.target === modal || event.target.id === 'cancel' || event.target.id === 'close') {
                //modal.classList.add('isHidden');
                toggleElement(modal);
                document.forms['new-review-form'].reset();
            } else if(event.target.id === 'open-modal'){
                //modal.classList.remove('isHidden');
                toggleElement(modal);
            }
        });

        // document.getElementById('submit-btn').addEventListener('click', (event) => {
        //     // process post here??        
        //     console.log('submit clicked, how to get the data?', event);
        //     //DBHelper.
        // });

        document.forms['new-review-form'].onsubmit = function (event) {
            event.preventDefault();
            submitReview(event.target);
        };
    };

    const toggleElement = function(el) {
        el.classList.contains('isHidden') ? el.classList.remove('isHidden') : el.classList.add('isHidden');
    };
    
    const submitReview = function (form){

        // FormData works only with strings
        // maybe use a json format??
        //let form = new FormData(data);
        // let rating = parseInt(form.get('rating'));
        // form.set('rating', rating);

        // TODO VALIDATE VALUES!

        let review = {};
        review[form.restaurant_id.name] = parseInt(form.restaurant_id.value);
        review[form.name.name] = form.name.value;
        review[form.rating.name] = parseInt(form.rating.value);
        review[form.review.name] = form.review.value;

        DBHelper.saveNewReview(review)
            .then(result => {
                console.log(result);
                // Display the newly saved review
                fillNewReviewHTML(result);
                // Close and reset the modal
                toggleElement(document.getElementById('review-modal'));
                document.forms['new-review-form'].reset();
            });

    };
}

