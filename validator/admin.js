
const validator = require('validator');
const errors = require('../helpers/errors');




exports.validateAuth = async  (req) =>{

    const { email ,password} = req.body;


 
    if (!validator.isEmail(email)) {
        throw new errors.INVALID_FIELDS_PROVIDED('Invalid email format.');
    }

    if (!validator.isLength(password, { min: 10, max: 20 })) {
        throw new errors.INVALID_FIELDS_PROVIDED('Password must be between 8 and 12 characters.');
    }



}



