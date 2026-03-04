const axios = require('axios');
const SystemSetting = require('../models/SystemSetting'); // Import to fetch dynamic settings

/**
 * WhatsApp Notification Service
 * 
 * Supports different providers. Reads configuration dynamically from the database.
 */

const getProviderConfig = async () => {
    try {
        const settings = await SystemSetting.findAll({
            where: {
                key_name: ['whatsapp_enabled', 'whatsapp_provider', 'whatsapp_api_key', 'whatsapp_instance_id']
            }
        });

        const config = {
            enabled: false,
            provider: 'mock',
            apiKey: '',
            instanceId: ''
        };

        settings.forEach(s => {
            if (s.key_name === 'whatsapp_enabled') config.enabled = s.value === 'true';
            if (s.key_name === 'whatsapp_provider') config.provider = s.value;
            if (s.key_name === 'whatsapp_api_key') config.apiKey = s.value;
            if (s.key_name === 'whatsapp_instance_id') config.instanceId = s.value;
        });

        return config;
    } catch (err) {
        console.error('[WhatsApp Config Error]', err);
        return { enabled: false, provider: 'mock', apiKey: '', instanceId: '' };
    }
};

/**
 * Sends a WhatsApp message using the configured provider.
 * @param {string} to - The recipient phone number (international format e.g. +94...)
 * @param {string} message - The message body
 */
const sendWhatsAppMessage = async (to, message) => {
    try {
        if (!to) {
            console.warn('[WhatsApp] Skipping message: No recipient provided.');
            return false;
        }

        const config = await getProviderConfig();

        if (!config.enabled) {
            console.warn('[WhatsApp] Skipping message: WhatsApp notifications are DISABLED in settings.');
            return false;
        }

        switch (config.provider) {
            case 'ultramsg':
                const response = await axios.post(`https://api.ultramsg.com/${config.instanceId}/messages/chat`, {
                    token: config.apiKey,
                    to: to,
                    body: message
                });
                console.log(`[WhatsApp UltraMsg] Message sent to ${to}:`, response.data);
                return true;

            case 'twilio':
                // Example for Twilio (usually better to use twilio npm package, but keeping it generic here)
                // Note: requires setting up proper Twilio auth headers
                console.log(`[WhatsApp Twilio] Mock sending message to ${to}`);
                return true;

            case 'meta':
                // Example for official Meta Cloud API
                console.log(`[WhatsApp Meta Cloud API] Mock sending message to ${to}`);
                return true;

            case 'mock':
            default:
                // Development mode logging
                console.log('\n======================================================');
                console.log('📲 [MOCK WHATSAPP MESSAGE]');
                console.log(`To:      ${to}`);
                console.log(`Message: \n${message}`);
                console.log('======================================================\n');
                return true;
        }
    } catch (error) {
        console.error('[WhatsApp Error] Failed to send message:', error.response?.data || error.message);
        return false;
    }
};

module.exports = {
    sendWhatsAppMessage
};
