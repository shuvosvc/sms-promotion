
const { api, auth } = require("../helpers/common");
const errors = require("../helpers/errors");
const { SGU_pass, SGU_user, SGUM, DEVICE_ID, HOOK_ID } = require("../config/ApplicationSettings");


const axios = require("axios");
const moment = require("moment");
const { parsePhoneNumberFromString } = require('libphonenumber-js');
const { log } = require("logfmt");



// exports.msg = api(["promotionId", "phoneNumbers"], auth(async (req, connection) => {
//     const {phoneNumbers, promotionId } = req.body;


//     // Step 2: Validate phoneNumbers array
//     if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) throw new errors.INVALID_FIELDS_PROVIDED();

//     // Step 3: Separate valid & invalid phone numbers
//     const validPhoneNumbers = [];
//     const invalidPhoneNumbers = [];

//     phoneNumbers.forEach(phone => {
//         const phoneNumber = parsePhoneNumberFromString(phone);
//         if (phoneNumber && phoneNumber.isValid()) {
//             validPhoneNumbers.push(phoneNumber.number); // Save valid number in E.164 format
//         } else {
//             invalidPhoneNumbers.push(phone);
//         }
//     });

//     let promotionInfo = null;

//     if (validPhoneNumbers.length > 0) {

//         const isExist = await connection.queryOne(
//             `SELECT id,msg FROM promotion WHERE id = $1 AND deleted = FALSE`,
//             [promotionId]
//         );

//         if (!isExist) {
//             throw new errors.NOT_FOUND("Promotion not found");
//         }
//         promotionInfo = isExist;

//     }

//     // Step 4: Send SMS only if there are valid numbers
//     let responseData = null;




//     if (validPhoneNumbers.length > 0) {
//         const response = await axios.post(SGUM, {
//             message:  promotionInfo.msg,
//             phoneNumbers: validPhoneNumbers,
//         }, {
//             auth: {
//                 username: SGU_user,
//                 password: SGU_pass,
//             },
//             headers: {
//                 "Content-Type": "application/json"
//             }
//         });

//         responseData = response.data; // Store API response
//     }

//  if (responseData && responseData.id) {  

    
//   const values = validPhoneNumbers.map(phone =>
//     `(${responseData.id},${promotionInfo.id} , '${phone}')`
//   ).join(",");

//   const insertQuery = `
//     INSERT INTO sms_log (id,promotion_id, phone, )
//     VALUES ${values}
//   `;

//   await connection.query(insertQuery);
// }


//     // Step 6: Return response
//     return {
//         success: true,
//         invalidNumbers: invalidPhoneNumbers, responseData
//     };
// }));














exports.msg = api(["promotionId", "phoneNumbers"], auth(async (req, connection) => {
  const { phoneNumbers, promotionId } = req.body;

  if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
    throw new errors.INVALID_FIELDS_PROVIDED("Invalid or empty phoneNumbers array.");
  }

  const validPhoneNumbers = [];
  const invalidPhoneNumbers = [];

  phoneNumbers.forEach(phone => {
    const phoneNumber = parsePhoneNumberFromString(phone);
    if (phoneNumber && phoneNumber.isValid()) {
      validPhoneNumbers.push(phoneNumber.number);
    } else {
      invalidPhoneNumbers.push(phone);
    }
  });

  if (validPhoneNumbers.length === 0) {
    return {
      success: false,
      message: "No valid phone numbers provided",
      invalidNumbers: invalidPhoneNumbers
    };
  }

  const promotionInfo = await connection.queryOne(
    `SELECT id, msg FROM promotion WHERE id = $1 AND deleted = FALSE`,
    [promotionId]
  );

  if (!promotionInfo) {
    throw new errors.NOT_FOUND("Promotion data not found");
  }

  const response = await axios.post(SGUM, {
    message: promotionInfo.msg,
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

  const responseData = response.data;

  

  if (responseData && responseData.id) {
  const values = validPhoneNumbers.map(phone =>
    `('${responseData.id}', ${promotionInfo.id}, '${phone}')`
  ).join(",");

  const insertQuery = `
    INSERT INTO sms_log (hook_id, promotion_id, phone)
    VALUES ${values}
  `;

  await connection.query(insertQuery);
}

  return {
    success: true,
    invalidNumbers: invalidPhoneNumbers,
    responseData
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



exports.hookapi = api(["deviceId", "webhookId", "payload"], async (req, connection) => {
  const { deviceId, payload } = req.body;
  const { messageId, phoneNumber, deliveredAt } = payload;

  console.log("req.body.payload", payload);

  // 🔒 Validate device ID
  if (deviceId !== DEVICE_ID) throw new errors.UNAUTHORIZED();

  // 🕒 Format timestamp (to UTC SQL format)
  const deliveredAtUTC = moment(deliveredAt).utc().format('YYYY-MM-DD HH:mm:ss.SSS');

  // ✅ Update the delivery status
  await connection.query(
    `UPDATE sms_log
     SET delivery_status = $1,
         status_updated_at = $2
     WHERE hook_id = $3 AND phone = $4`,
    ['success', deliveredAtUTC, messageId, phoneNumber]
  );

  return { flag: 200 };
});







