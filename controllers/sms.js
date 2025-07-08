
const { api, auth} = require("../helpers/common");
const errors = require("../helpers/errors");
const {  SGU_pass, SGU_user ,SGUM,DEVICE_ID,HOOK_ID} = require("../config/ApplicationSettings");


const axios = require("axios");
const moment = require("moment");
const { parsePhoneNumberFromString } = require('libphonenumber-js');
const { log } = require("logfmt");



exports.msg = api(["message", "phoneNumbers"], auth(async (req, connection, secret) => {
    const { message, phoneNumbers } = req.body;


    // Step 2: Validate phoneNumbers array
    if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0)throw new errors.INVALID_FIELDS_PROVIDED();

    // Step 3: Separate valid & invalid phone numbers
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

    // Step 4: Send SMS only if there are valid numbers
    let responseData = null;
    if (validPhoneNumbers.length > 0) {
        const response = await axios.post(SGUM, {
            message,
            phoneNumbers: validPhoneNumbers,
        }, {
            auth: {
                username: SGU_user,
                password: SGU_pass,
            },
            headers: {
                "Content-Type": "application/json"
            }
        });

        responseData = response.data; // Store API response
    }

    // Step 5: Insert into database
    if (responseData ) {
         // Convert to SQL timestamp format
        const msg_id = responseData.id;

        const values = validPhoneNumbers.map(phone => `('${phone}', '${message}', '${msg_id}', '${secret.parsedTime}')`).join(",");

        const insertQuery = `
            INSERT INTO sms_log (phone, msg, msg_id, sent_at)
            VALUES ${values}
        `;

        await connection.query(insertQuery);
    }

    // Step 6: Return response
    return {
        success: true,
        invalidNumbers: invalidPhoneNumbers,responseData
    };
}));


// {
//     "deviceId": "MLQTSyKUUHW8OvutqAMq1",
//     "event": "sms:delivered",
//     "id": "p_y--hf6vsrHiL0E9D_Ac",
//     "payload": {
//       "deliveredAt": "2025-02-15T12:16:11.581+06:00",
//       "messageId": "CQ_F2xiW46aY9hp6Dz1IE",
//       "phoneNumber": "+8801629613514"
//     },
//     "webhookId": "7061svclmsgid2333"
//   }

exports.hookapi = api(["deviceId", "webhookId","payload"],async (req, connection) => {

const {messageId,phoneNumber,deliveredAt} =req.body.payload
console.log("req.body.payload",req.body.payload);


  if (req.body.deviceId !== DEVICE_ID
  ) throw new errors.UNAUTHORIZED;


       
    const deliveredAtUTC = moment(deliveredAt).utc().format('YYYY-MM-DD HH:mm:ss.SSS');


  // Save refresh token
  await connection.query(
    "UPDATE sms_log SET status = $1 ,delivered_at = $2 WHERE msg_id = $3 and phone =$4",
    [true, deliveredAtUTC,messageId,phoneNumber]
  );
    // res.status(200).send("OK");

return{flag:200}

})










