# scrape-frame
A web-scraping framework that can be tailored to retrieve information from any website

# Create a new project
First things first: After downloading scrape-frame, install everything you will need by entering the top level directory and executing: npm install

Creating a new scraper is very simple. Read below for some information on the options, and take a look at the included example to get an idea of it's structure.

node scrape-frame.js new name-of-website method [url of main page]

This command creates a new set of programs and baseline tests in the 'scrapers' directory:
-scrape.js
-selectors.js
-utils.js
-temp-scrape.js
-output directory
-log.txt
-empty-or-error.txt
-scrape-tests.js

The method argument, which can be either 'direct' or 'nightmare', has to do with whether the website in question has a direct URL to the page that you want to scrape. If it does, use 'direct', but if the only way to get to the desired page is by entering info and clicking buttons, then you will have to use 'nightmare'. This is something you should determine BEFORE making a new project. Note: If the website involves logging into a user account, as in the reddit example, you will have to use nightmare.

Tip: Many sites might not allow direct URL access to a page from an external location, but might allow direct access to that page from the main page of their site. Entering the main page creates a session, which then opens up many other parts of the site to anyone who is within that session. Taking advantage of this can cut out a lot of navigation through nightmare.

# structure
temp-scrape.js: This is where you will determine your selectors, and the path of your crawler (if using nightmare).
scrape.js: This is the meat of the scraper, and contains the xray and nightmare instances. The culmination of your experiments in temp-scrape.js will be instantiated here.





TODO: include function that takes a url, goes to a site's main page, attempts to navigate to another spot, and thentries to get there directly to see if nightmare is required. Can also take two args, main page and target page, to achieve the same result.
