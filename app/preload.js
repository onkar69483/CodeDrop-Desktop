const { contextBridge } = require('electron');
const axios = require('axios');
require('dotenv').config();

const SERVER_URL = process.env.SERVER_URL || "http://localhost:3000";

contextBridge.exposeInMainWorld('electron', {
    getClipboardHistory: async () => {
        try {
            const response = await axios.get(`${SERVER_URL}/api/getClipboard`);
            return response.data;
        } catch (err) {
            console.error("Error fetching clipboard history:", err);
            return [];
        }
    }
});
