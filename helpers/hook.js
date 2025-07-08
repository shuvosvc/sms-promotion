const { BASE_URL, SGU_pass, SGU_user,SGUH ,HOOK_ID} = require("../config/ApplicationSettings");
const axios = require("axios");


exports.registerWebhook = async (serverpath) => {
    const webhookURL = `${serverpath}${BASE_URL}/sms-status`; // Construct webhook URL dynamically
    console.log(`🔗 Registering webhook at: ${webhookURL}`);

    try {
        const response = await axios.post(
            SGUH,
            {   id: HOOK_ID,
                url: webhookURL,
                event: "sms:delivered",
            },
            {
                auth: {
                    username: SGU_user,
                    password: SGU_pass,
                },
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
        console.log("✅ Webhook registered successfully:", response.data);
    } catch (error) {
        console.error("❌ Error registering webhook:", error.response?.data || error.message);
    }
};




exports.closeWebhook = async () => {
    try {
        const response = await axios.delete(
            `${SGUH}/${encodeURIComponent(HOOK_ID)}`,
            {
                auth: {
                    username: SGU_user,  // Replace with your actual username
                    password: SGU_pass,  // Replace with your actual password
                },
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
        console.log("✅ Webhook deleted successfully:", response.data);
    } catch (error) {
        console.error("❌ Error deleting webhook:", error || error.message);
    }
};