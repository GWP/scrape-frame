
var selectorsmap = {
  //this is where you define all of the elements that you want to extract from the webpage, as formatted below. If you want to hit multiple elements with one selector, you need to enclose it in brackets, so that the return value is an array.
  pin: 'p table tr + tr td:contains("PIN/Schedule")',
  design: ['div p table tr:nth-of-type(3) td:contains("Design")']
};


var generalInformation = {
  pin: selectorsmap.pin,
  design: selectorsmap.design
};


//now allow other files to import the selectors
module.exports = {
  generalInformation: generalInformation
};
