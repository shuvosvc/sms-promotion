const crypto = require("crypto");
const axios = require("axios");

const {  SECRET_KEY,BASE_URL } = require("./config/ApplicationSettings");
 // 🔒 Shared secret key
console.log(SECRET_KEY);

const createSignature = (body, timestamp) => {
    return crypto.createHmac("sha256", SECRET_KEY)  // 🔹 Use HMAC-SHA256
        .update(JSON.stringify(body) + timestamp)  // 🔹 Hash the body + timestamp
        .digest("hex");  // 🔹 Convert to hex string
};

const sendSMS = async () => {
    try {
        const reqBody = {
            message: "ok this is working domain is fixed and sms returning in hook",
            phoneNumbers: ["+8801629615314","+8801521236479","11234"]
        };

        const timestamp = Date.now();
        const signature = createSignature(reqBody, timestamp);

  
        const serverpath="https://eminent-internal-thrush.ngrok-free.app"
        // Sending the request with the hash
        const response = await axios.post(`${serverpath}${BASE_URL}/send-sms`, reqBody, {
            headers: {
                "x-api-key": "qikwallet",
                "x-signature": signature,  // 🔹 Send generated hash
                "x-timestamp": timestamp   // 🔹 Send timestamp
            }
        });

        console.log("hit response=", response.data);
    } catch (error) {
        console.error("Error:", error.response ? error.response.data : error.message);
    }
};

// Call the function
sendSMS();
