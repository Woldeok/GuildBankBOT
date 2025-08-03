const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session'); // express-session 추가
const authRoutes = require('./routes/auth');

const app = express();

// EJS 뷰 엔진 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // 뷰 파일 경로 설정

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 세션 미들웨어 설정
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_key', // .env 파일에 SESSION_SECRET 추가 권장
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' } // HTTPS 환경에서만 secure: true
}));

// 정적 파일 제공 (views 디렉토리 내의 CSS, JS 등)
app.use(express.static(path.join(__dirname, 'views')));

app.use('/auth', authRoutes);

// 루트 경로 (/) 처리
app.get('/', (req, res) => {
    if (req.session.user) {
        // 세션에 사용자 정보가 있으면 대시보드 렌더링
        res.render('dashboard', { user: req.session.user, isAdmin: req.session.isAdmin });
    } else {
        // 세션에 사용자 정보가 없으면 로그인 페이지 렌더링
        res.render('index');
    }
});

// 로그아웃 라우트
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('세션 파괴 중 오류:', err);
            return res.status(500).send('로그아웃 실패');
        }
        res.redirect('/'); // 로그인 페이지로 리디렉션
    });
});

module.exports = app;