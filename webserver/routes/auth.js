const express = require('express');
const router = express.Router();
const { exchangeCodeForToken, getUserInfo, isAdmin } = require('../services/discordAuth');
require('dotenv').config();

const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;

router.get('/discord', (req, res) => {
    const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=identify`;
    res.redirect(discordAuthUrl);
});

router.get('/discord/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) {
        return res.status(400).send('Authorization code not provided.');
    }

    try {
        const tokenData = await exchangeCodeForToken(code);
        const userInfo = await getUserInfo(tokenData.access_token);

        const userIsAdmin = isAdmin(userInfo.id);

        // 로그인 정보 콘솔에 출력
        console.log(`[Discord OAuth] 사용자 로그인: ${userInfo.username} (ID: ${userInfo.id}), 관리자 여부: ${userIsAdmin ? '관리자' : '일반 사용자'}`);

        // For simplicity, we'll redirect to the frontend with user info and admin status
        // In a real application, you'd use sessions/JWTs
        // 로그인 정보 콘솔에 출력 (기존 로직 유지)
        console.log(`[Discord OAuth] 사용자 로그인: ${userInfo.username} (ID: ${userInfo.id}), 관리자 여부: ${userIsAdmin ? '관리자' : '일반 사용자'}`);

        // 세션에 사용자 정보 저장
        req.session.user = {
            username: userInfo.username,
            avatar: userInfo.avatar,
            id: userInfo.id
        };
        req.session.isAdmin = userIsAdmin;

        res.redirect('/'); // 루트 경로로 리디렉션

    } catch (error) {
        console.error('Discord OAuth callback error:', error);
        res.status(500).send('Authentication failed.');
    }
});

module.exports = router;