document.addEventListener('DOMContentLoaded', () => {
    const appContent = document.getElementById('app-content');

    const renderLogin = () => {
        appContent.innerHTML = `
            <p class="mb-4">Discord 계정으로 로그인하여 관리자 여부를 확인하세요.</p>
            <button id="login-button" class="btn btn-primary btn-lg">
                Discord로 로그인
            </button>
        `;
        document.getElementById('login-button').addEventListener('click', () => {
            window.location.href = '/auth/discord'; // 백엔드 Discord OAuth2 시작 엔드포인트
        });
    };

    const renderDashboard = (username, avatar, id, isAdmin) => {
        const avatarUrl = avatar ? `https://cdn.discordapp.com/avatars/${id}/${avatar}.png?size=128` : '';
        const adminStatusClass = isAdmin ? 'text-success' : 'text-danger';
        const adminStatusText = isAdmin ? '당신은 관리자입니다.' : '당신은 관리자가 아닙니다.';

        appContent.innerHTML = `
            ${avatarUrl ? `<img src="${avatarUrl}" alt="User Avatar" class="rounded-circle mb-3" width="96" height="96">` : ''}
            <h2 class="mb-2">환영합니다, ${username}!</h2>
            <p class="lead ${adminStatusClass}">
                ${adminStatusText}
            </p>
            <button id="logout-button" class="btn btn-danger mt-3">
                로그아웃
            </button>
        `;
        document.getElementById('logout-button').addEventListener('click', () => {
            // URL에서 쿼리 파라미터 제거 및 로그인 화면으로 전환
            window.history.replaceState({}, document.title, "/");
            renderLogin();
        });
    };

    // URL 파라미터에서 사용자 정보 가져오기
    const params = new URLSearchParams(window.location.search);
    const username = params.get('username');
    const avatar = params.get('avatar');
    const id = params.get('id');
    const isAdminParam = params.get('isAdmin');

    if (username && id) {
        // 사용자 정보가 URL에 있으면 대시보드 렌더링
        renderDashboard(username, avatar, id, isAdminParam === 'true');
    } else {
        renderLogin();
    }
});