
var selectorsmap = {
  
  pin: 'p table tr + tr td:contains("PIN/Schedule")',
  parcelNumber: 'p table tr + tr td:contains("Parcel")',
  propertyType: 'p table tr + tr td:contains("Property Type"):nth-of-type(2)',
  propertyAddressStreet: 'p table tr td table tr td:contains("Property Address") + td',
  propertyAddressCityState: 'div p:nth-of-type(1) table tr td table tr:nth-of-type(2) td + td',
  neighborhood: 'div p:nth-of-type(1) table tr:nth-of-type(2) td:contains("Neighborhood")',

  inventoryPropertyType: 'div p table tr:nth-of-type(2) td:contains("Property Type")',
  improvementNumber: ['p table tr + tr + tr td:contains("Improvement") option'],
  yearBuiltAndAdjusted: ['div p table tr:nth-of-type(2) td:contains("Year")'],
  design: ['div p table tr:nth-of-type(3) td:contains("Design")'],

  improvementHeaders: ['div p:nth-of-type(2) table:nth-of-type(2) tr td table tr td:nth-of-type(1)'],
  improvementSecondColumn: ['div p:nth-of-type(2) table:nth-of-type(2) tr td table tr td:nth-of-type(2)'],
  improvementThirdColumn: ['div p:nth-of-type(2) table:nth-of-type(2) tr td table tr td:nth-of-type(3)'],
  improvementFourthColumn: ['div p:nth-of-type(2) table:nth-of-type(2) tr td table tr td:nth-of-type(4)'],

  improvements: ['div p:nth-of-type(2) table:nth-of-type(2) tr td table tr'],

  subdivisionName: ['div table:nth-of-type(3) tr:nth-of-type(2) td'],
  propertyTotalLand: ['table tr:nth-of-type(3) td:nth-of-type(8)'],
  saleHistory: 'div table:nth-of-type(2) tr',
  taxInformation: ['div table:nth-of-type(4) tr td table tr td:nth-of-type(2)'],

  neighborhoodSales: ['div p table:nth-of-type(2) tr'] //different URL


};


var generalInformation = {
  pin: selectorsmap.pin,
  parcelNumber: selectorsmap.parcelNumber,
  propertyType: selectorsmap.propertyType,
  propertyAddressStreet: selectorsmap.propertyAddressStreet,
  propertyAddressCityState: selectorsmap.propertyAddressCityState,
  neighborhood: selectorsmap.neighborhood
};

var propertyInventory = {
  inventoryPropertyType: selectorsmap.inventoryPropertyType,
  improvementNumber: selectorsmap.improvementNumber,
  yearBuiltAndAdjusted: selectorsmap.yearBuiltAndAdjusted,
  design: selectorsmap.design,
  subdivisionName: selectorsmap.subdivisionName,
  propertyTotalLand: selectorsmap.propertyTotalLand,
  taxInformation: selectorsmap.taxInformation
};

var improvements = {
  improvements: selectorsmap.improvements
};

var neighborhoodSalesInfo = {
  neighborhoodSales: selectorsmap.neighborhoodSales
};

module.exports = {
  generalInformation: generalInformation,
  propertyInventory: propertyInventory,
  improvements: improvements,
  neighborhoodSalesInfo: neighborhoodSalesInfo
};
