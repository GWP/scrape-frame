function getPropertyPageUrL(propertyNumber){
  var propertyBaseUrl = 'http://ats.jeffco.us/ats/displaygeneral.do?sch='
  return propertyBaseUrl + propertyNumber;
};

function getPropertyImpURLs(propertyNumber, impnbr){
  var propertyImpURLs = [];
  var propertyBaseUrl = 'http://ats.jeffco.us/ats/displaygeneral.do?impnbr=';
  for (var i = 2; i < impnbr+1; i++){
    propertyBaseUrl += i;
    propertyBaseUrl += '&sch=';
    propertyBaseUrl += propertyNumber;
    propertyImpURLs.push(propertyBaseUrl);
    propertyBaseUrl = 'http://ats.jeffco.us/ats/displaygeneral.do?impnbr=';
  }
  return propertyImpURLs;
};

function getNeighborhoodSalesURL(propertyNumber){
  var baseURL = 'http://ats.jeffco.us/ats/neighborhoodsales.do?sch=';
  return baseURL + propertyNumber;
};

//Extra space is needed initially to make the number a string, as otherwise it gets converted to binary for some values
function padToNine(number) {
  if (number <= 999999999) { number = " " + ("000000000" + number).slice(-9); }
  return number.substr(1);
};

module.exports = {
  getPropertyPageUrL: getPropertyPageUrL,
  getPropertyImpURLs: getPropertyImpURLs,
  getNeighborhoodSalesURL: getNeighborhoodSalesURL,
  padToNine: padToNine
};
