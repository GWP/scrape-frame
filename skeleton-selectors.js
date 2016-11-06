/*
  This is where you define all of the elements that you want to extract from the webpage, as formatted below. One of the best ways to do this, is to open the developer console in your browser,
  and to create a string of selectors as is shown below. Find the element that you want to extract, put it's name at the end of the string,
  and then trace its parent elements back as far you can. A 'tr' nested within a 'td', within a table, within a 'div', would be 'div table td tr'.
  If the 'tr' happens to be the second one that is nested within the 'td' then the string would look like 'div table td tr:nth-of-type(2)'.
  The best case scenario is when an element has an id or contains an identifying factor, such as 'div[id="propertyDetails"]' and 'td:contains("Design")' respectively.
  Play around with the selector strings in the testing file, until you get the results you want in results.json.
*/


var selectorsmap = {
  pin: 'p table tr + tr td:contains("PIN/Schedule")',
  design: ['div p table tr:nth-of-type(3) td:contains("Design")'] //If you want to hit multiple elements with one selector, you need to enclose it in brackets, so that the return value is an array.

};


var generalInformation = { //This intermediate grouping is not required, but makes it easier if you want to group your selectors by the kind of information they present.
  pin: selectorsmap.pin,
  design: selectorsmap.design
};


module.exports = {
  generalInformation: generalInformation
};
