const { parsePhoneNumberFromString } = require('libphonenumber-js');

const phoneNumbers=["01629615314","+8801629613514","+8801626487","11234"]

const validPhoneNumbers = [];
const invalidPhoneNumbers = [];

phoneNumbers.forEach(phone => {
    const phoneNumber = parsePhoneNumberFromString(phone);
    if (phoneNumber && phoneNumber.isValid()) {
        validPhoneNumbers.push(phoneNumber.number); // Save valid number in E.164 format
    } else {
        invalidPhoneNumbers.push(phone);
    }
});

console.log({validPhoneNumbers,invalidPhoneNumbers});
