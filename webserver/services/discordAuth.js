const fetch = require('node-fetch').default;
require('dotenv').config();

const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;

async function exchangeCodeForToken(code) {
    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
        scope: 'identify'
    });

    const response = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Error exchanging code for token:', errorData);
        throw new Error('Failed to exchange code for token');
    }

    return response.json();
}

async function getUserInfo(accessToken) {
    const response = await fetch('https://discord.com/api/users/@me', {
        headers: {
            authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Error fetching user info:', errorData);
        throw new Error('Failed to fetch user info');
    }

    return response.json();
}

function isAdmin(userId) {
    const adminIds = process.env.ADMIN_USER_IDS ? process.env.ADMIN_USER_IDS.split(',').map(id => id.trim()) : [];
    return adminIds.includes(userId);
}

module.exports = {
    exchangeCodeForToken,
    getUserInfo,
    isAdmin,
};