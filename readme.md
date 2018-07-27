# Udacity Mobile Web Specialist Certification Course
---
#### _Three Stage Course Material Project - Restaurant Reviews_

For the  **Restaurant Reviews**  projects, you will incrementally convert a static web-page to a mobile-ready web application.

## General style requirements

Make sure your code adheres to our HTML, CSS, JavaScript, and Git style guidelines.

- [Udacity's HTML Style Guide](http://udacity.github.io/frontend-nanodegree-styleguide/index.html)
- [Udacity's CSS Style Guide](http://udacity.github.io/frontend-nanodegree-styleguide/css.html)
- [Udacity's JavaScript Style Guide](http://udacity.github.io/frontend-nanodegree-styleguide/javascript.html)
- [Udacity's Git Style Guide](https://udacity.github.io/git-styleguide/)

We recommend using Git from the very beginning. Make sure to commit often and to use well-formatted commit messages that conform to our guidelines.

## Project Overview: Stage 2
In  **Stage Two**, you will take the responsive, accessible design you built in  **Stage One**  and connect it to an external server. You'll begin by using asynchronous JavaScript to request JSON data from the server. You'll store data received from the server in an offline database using IndexedDB, which will create an app shell architecture. Finally, you'll work to optimize your site to meet performance benchmarks, which you'll test using  [Lighthouse](https://developers.google.com/web/tools/lighthouse/).

### 2.1. Specification

You will be provided code for a Node development server and a README for getting the server up and running locally on your computer. The README will also contain the API you will need to make JSON requests to the server. Once you have the server up, you will begin the work of improving your  **Stage One** project code.

The core functionality of the application will not change for this stage. Only the source of the data will change. You will use the  `fetch()`  API to make requests to the server to populate the content of your Restaurant Reviews app.

Detailed Project Specification:
[Rubric](https://review.udacity.com/#!/rubrics/1131/view) or 
[local copy](readme-stage2-rubric.md)

### 2.2. Requirements

**Use server data instead of local memory**  In the first version of the application, all of the data for the restaurants was stored in the local application. You will need to change this behaviour so that you are pulling all of your data from the server instead, and using the response data to generate the restaurant information on the main page and the detail page.

**Use IndexedDB to cache JSON responses**  In order to maintain offline use with the development server you will need to update the service worker to store the JSON received by your requests using the IndexedDB API. As with  **Stage One**, any page that has been visited by the user should be available offline, with data pulled from the shell database.

**Meet the minimum performance requirements**  Once you have your app working with the server and working in offline mode, you'll need to measure your site performance using  [Lighthouse](https://developers.google.com/web/tools/lighthouse/).

Lighthouse measures performance in four areas, but your review will focus on three:

-   **Progressive Web App**  score should be at 90 or better.
-   **Performance**  score should be at 70 or better.
-   **Accessibility**  score should be at 90 or better.

You can audit your site's performance with Lighthouse by using the Audit tab of Chrome Dev Tools.

### 2.3. Steps to complete

1.  Fork and clone the  [server repository](https://github.com/udacity/mws-restaurant-stage-2). You'll use this development server to develop your project code.
2.  Change the data source for your restaurant requests to pull JSON from the server (see [server readme](readme-server.md)), parse the response and use the response to generate the site UI.
3.  Cache the JSON responses for offline use by using the IndexedDB API.
4.  Follow the recommendations provided by Lighthouse to achieve the required performance targets.
5.  Submit your project code for review.


## Project Overview: Stage 1

In **Stage One**, you will take a static design that lacks accessibility and convert the design to be responsive on different sized displays and accessible for screen reader use. You will also add a service worker to begin the process of creating a seamless offline experience for your users.

### 1.1. Specification

You have been provided the code for a restaurant reviews website. The code has a lot of issues. It's barely usable on a desktop browser, much less a mobile device. It also doesn't include any standard accessibility features, and it doesn't work offline at all. Your job is to update the code to resolve these issues while still maintaining the included functionality. 

Detailed Project Specification:
[Rubric](https://review.udacity.com/#!/rubrics/1090/view) or 
[local copy](readme-stage1-rubric.md)

### 1.2. Requirements
**Make the provided site fully responsive.** All of the page elements should be usable and visible in any viewport, including desktop, tablet, and mobile displays. Images shouldn't overlap, and page elements should wrap when the viewport is too small to display them side by side.

**Make the site accessible.** Using what you've learned about web accessibility, ensure that alt attributes are present and descriptive for images. Add screen-reader-only attributes when appropriate to add useful supplementary text. Use semantic markup where possible, and aria attributes when semantic markup is not feasible.

**Cache the static site for offline use.** Using Cache API and a ServiceWorker, cache the data for the website so that any page (including images) that has been visited is accessible offline.

### 1.3. Steps to complete 

1. Fork and clone the starter repository. The code in this repository will serve as your baseline to begin development.
2. You'll need your own Google Maps API key. Replace the text YOUR_GOOGLE_MAPS_API_KEY on line 37 of index.html with your own key.
    [Google developers console](https://console.developers.google.com)
3. Convert the provided site to use a responsive design .
    - Bootstrap and other CSS frameworks should not be used; all responsiveness should be done with CSS.
    - Use appropriate document type declaration and viewport tags
    - Create a responsive grid-based layout using CSS
    - Use media queries that provide fluid breakpoints across different screen sizes
    - Use responsive images that adjust for the dimensions and resolution of any mobile device
4. Implement accessibility features in the site HTML (most of this HTML is generated by JavaScript functions).
5. Add a ServiceWorker script to cache requests to all of the site's assets so that any page that has been visited by a user will be accessible when the user is offline. Only caching needs to be implemented, no other ServiceWorker features.

### 1.4. What do I do from here?

1. In this folder, start up a simple HTTP server to serve up the site files on your local computer. 

    - Using [http-server](https://www.npmjs.com/package/http-server) `http-server -p 8000 --cors`

    - Python has some simple tools to do this, and you don't even need to know Python. For most people, it's already installed on your computer. 

        In a terminal, check the version of Python you have: `python -V`. If you have Python 2.x, spin up the server with `python -m SimpleHTTPServer 8000` (or some other port, if port 8000 is already in use.) For Python 3.x, you can use `python3 -m http.server 8000`. If you don't have Python installed, navigate to Python's [website](https://www.python.org/) to download and install the software.

2. With your server running, visit the site: `http://localhost:8000`, and look around for a bit to see what the current experience looks like.
3. Explore the provided code, and make making start a plan to implement the required features in three areas: responsive design, accessibility and offline use.
4. Write code to implement the updates to get this site on its way to being a mobile-ready website.


### 1.5. Note about ES6

Most of the code in this project has been written to the ES6 JavaScript specification for compatibility with modern web browsers and future proofing JavaScript code. As much as possible, try to maintain use of ES6 in any additional JavaScript you write. 


### 1.6. Start

`python -m SimpleHTTPServer 8000`

`http-server -p 8000 --cors`


