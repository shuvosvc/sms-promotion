
const {  SGU_pass, SGU_user } = require("../config/ApplicationSettings");

const axios = require("axios");

const deleteWebhook = async (uniqueId) => {
    try {
        const response = await axios.delete(
            `https://api.sms-gate.app/3rdparty/v1/webhooks/${encodeURIComponent(uniqueId)}`,
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
        console.error("❌ Error deleting webhook:", error.response?.data || error.message);
    }
};

// Example usage with your unique webhook ID
const uniqueId = "061svcng1"; // Replace with the actual unique ID you want to delete
deleteWebhook(uniqueId);
