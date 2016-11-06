var selectorsmap = {
  propertyDetails: ['div[id="tabContent"] div[id="propertyDetails"] table tr td'],
  valuesDetails: ['div[id="tabContent"] div[id="valuesDetails"] table tr td'],
  improvements: ['div[id="tabContent"] div[id="improvementBuildingDetails"] table tr td'],
  improvementHeaders: ['div[id="tabContent"] div[id="improvementBuildingDetails"] table tr th'],
  landDetailsHeaders: ['div[id="tabContent"] div[id="landDetails"] table tr th'],
  landDetails: ['div[id="tabContent"] div[id="landDetails"] table tr td'],

  propertyListingPerPage: ['div[id="content"] div[id="propertySearchResults_searchResults"] table tr td:nth-of-type(2)'],
  arrayOfPages: ['div[id="content"] div[id="propertySearchResults_searchResults"] table tr td[class="paging"] a']
};

var data = {
  propertyDetails: selectorsmap.propertyDetails,
  valuesDetails: selectorsmap.valuesDetails,
  improvements: selectorsmap.improvements,
  improvementHeaders: selectorsmap.improvementHeaders,
  landDetailsHeaders: selectorsmap.landDetailsHeaders,
  landDetails: selectorsmap.landDetails
};

module.exports = {data: data};