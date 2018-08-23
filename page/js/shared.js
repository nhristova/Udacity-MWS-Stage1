// import { DBHelper } from './dbhelper.js';
// TODO find a way to use modules for all files
/* globals DBHelper */ 

/** Attaches event listeners to the passed element reference */
const initStarFav = function(elementRef) {
    elementRef.addEventListener('click', toggleStar);
    elementRef.addEventListener('keydown', toggleStar);
};

// https://www.w3.org/TR/2016/WD-wai-aria-practices-1.1-20160317/examples/checkbox/checkbox-1.html 
/** Adds relevant styles and calls dbhelper */
const toggleStar = function(event) {
    const prefix = 'star-fav-';
    const restaurantId = parseInt(event.target.id.slice(prefix.length));
    if(!event.target.id.startsWith(prefix)){
        return;
    }

    const star = event.target;

    event.preventDefault();
    event.stopPropagation();

    const newState = !star.classList.contains('star-checked');
    newState ? star.classList.add('star-checked') : star.classList.remove('star-checked');
    star.setAttribute('checked', newState);
    star.setAttribute('aria-checked', newState);
    DBHelper.toggleFavourite(restaurantId, newState);
};


export const shared = {
    initStarFav,
};
