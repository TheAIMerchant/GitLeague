const usernameInput = document.getElementById('username-input');
const generateBtn = document.getElementById('generate-btn');
const cardContainer = document.getElementById('card-container');
const navLinks = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page');
const fullLeaderboardList = document.getElementById('full-leaderboard-list');
const benchList = document.getElementById('bench-list');
const benchSearchInput = document.getElementById('bench-search-input');
const benchSearchBtn = document.getElementById('bench-search-btn');
const benchPlaceholder = document.getElementById('bench-placeholder');
const squad = document.getElementById('dream-team-squad');

let leaderboard = [
    {login: 'torvalds', name: 'Linus Torvalds', score: 99},
    {login: 'gaearon', name: 'Dan Abramov', score: 96},
    {login: 'sindresorhus', name: 'Sindre Sorhus', score: 95}
];
let benchPlayers = [];

// --- Navigation ---
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetPageId = link.getAttribute('data-page');
        pages.forEach(page => page.classList.remove('active'));
        navLinks.forEach(nav => nav.classList.remove('active'));
        document.getElementById(targetPageId).classList.add('active');
        link.classList.add('active');
        if (targetPageId === 'leaderboard-page') {
            renderFullLeaderboard();
        }
    });
});

async function fetchUserData(username) {
    const response = await fetch(`https://api.github.com/users/${username}`);
    if (!response.ok) throw new Error('User not found!');
    return await response.json();
}

function updateGlobalState(userData, stats) {
    const userSummary = {login: userData.login, name: userData.name, score: stats.ovr};
    const leaderIndex = leaderboard.findIndex(u => u.login.toLowerCase() === userSummary.login.toLowerCase());
        if (leaderIndex > -1) {
            leaderboard[leaderIndex] = userSummary;
        }
        else {
            leaderboard.push(userSummary);
        }
    const benchIndex = benchPlayers.findIndex(u => u.login.toLowerCase() === userData.login.toLowerCase());
        if (benchIndex === -1) {
            benchPlayers.push(userData);
            const benchCard = document.createElement('div');
            benchCard.className = 'dev-card-small';
            benchCard.innerHTML =`<p>${userData.name || userData.login}</p><span>OVR: ${stats.ovr}</span>`;
            benchList.appendChild(benchCard);
        }
}

// --- Leaderboard Logic ---
function renderFullLeaderboard() {
    fullLeaderboardList.innerHTML = '';
    leaderboard.sort((a,b) => b.score - a.score);
    leaderboard.forEach((user, index) => {
        const identiconUrl = `https://github.com/identicons/${user.login}.png`;
        const entry = document.createElement('li');
        entry.className = 'leaderboard-item';
        entry.innerHTML = `
          <span class="rank">${index + 1}.</span>
          <img src="${identiconUrl}" alt="${user.login}" class="identicon">
          <div class="name-block">
             <span class="name">${user.name || user.login.toUpperCase()}</span>
             <span class="handle">@${user.login}</span>
            </div>
            <span class="score">${user.score}</span>
        `;
        entry.addEventListener('click', () => {
            document.querySelector('.nav-link[data-page="generator-page"]').click();
            usernameInput.value = user.login;
            generateDisplayCard(user.login);
        });
        fullLeaderboardList.appendChild(entry);
    });
}


// --- Funchtion to display main card ---
async function generateDisplayCard(username) {
    if(!username) {
        alert("Please enter a GitHub username.");
        return;
    }
    cardContainer.innerHTML = `<p>Summoning Dev Card for ${username}...</p>`;
    try{
        const userData = await fetchUserData(username);
        const stats = calculateStats(userData);
        updateGlobalState(userData, stats);
        displayCard(userData, stats);
    }
    catch (error) {
        cardContainer.innerHTML = `<p style="color: red;">${error.message}</p>`;
    }
}

// --- Function to add players to bench ---
async function addUserToBench(username) {
    if (!username) return alert("Please enter a username to add.");
    if (benchPlayers.find(p => p.login.toLowerCase() === username.toLowerCase())) {
        return alert(`${username} is already on the bench!`);
    }
    
    try {
        const userData = await fetchUserData(username);
        const stats = calculateStats(userData);
        updateGlobalState(userData, stats);
        benchPlaceholder.style.display = 'none';
        benchSearchInput.value = '';        
    }
    catch (error) {
        alert(error.message);
    }
}

// --- Function to share card ---
function shareCard(username) {
    const url = `${window.location.origin}${window.location.pathname}?user=${username}`;
        if (navigator.share) {
            navigator.share({
                title: 'GitLeague Dev Card',
                text: `Check out ${username}'s Dev Card on GitLeague!`,
                url: url,
            });
        }
        else {
            navigator.clipboard.writeText(url).then(() => {
                alert('Share link copied to clipboard!');
            });
        }
}

// --- Function to load user from url ---
function loadUserFromURL () {
    const params = new URLSearchParams(window.location.search);
    const username = params.get('user');
    if (username) {
        usernameInput.value = username;
        generateDisplayCard(username);
    }
}

// --- STATS CALCULATION ---
function calculateStats(user) {
    if (user.login.toLowerCase() === 'torvalds') {
        return {
            pac: user.public_repos, dri: user.followers, pas: user.following, ovr: 99
        };
    }
    if (user.login.toLowerCase() === 'gaearon') {
        return {
            pac: user.public_repos, dri: user.followers, pas: user.following, ovr: 96
        };
    }
    if (user.login.toLowerCase() === 'sindresorhus') {
        return {
            pac: user.public_repos, dri: user.followers, pas: user.following, ovr: 95
        }
    }

    const scaledPac = Math.min(10 + Math.floor(89 * (Math.log(user.public_repos + 1) / Math.log(2000 + 1))), 99);
    const scaledDri = Math.min(10 + Math.floor(89 * (Math.log(user.followers + 1) / Math.log(200000 + 1))), 99);
    const scaledPas = Math.min(10 + Math.floor(89 * (Math.log(user.following + 1) / Math.log(5000 + 1))), 99);
    const ovr = Math.floor((scaledPac * 0.3) + (scaledDri * 0.6) + (scaledPas * 0.1));

    return {
        pac: user.public_repos,
        dri: user.followers,
        pas: user.following,
        ovr: Math.min(ovr,99)
    };
}

// --- Display ---
function displayCard(user, stats) {

    const identiconUrl = `https://github.com/identicons/${user.login}.png`;
    const cardHTML =
        `<div class="dev-card">
            <div class="card-header">
                <img src="${identiconUrl}" alt="Identicon" class="identicon">
                <!-- <p>${user.bio || 'This developer is a mystery...'}</p> -->
                <div class="ovr-score">
                    <p>OVR</p>
                    <h2>${stats.ovr}</h2>
                </div>      
            </div>
            <div class="name-block">
                <h2>${user.name || user.login}</h2>
                <p class="handle">@${user.login}</p>
            </div>
            <div class="card-stats">
                <div class="stat-item">
                    <span class="label">PAC (Repos)</span>
                    <h3>${stats.pac.toLocaleString()}</h3>
                </div>
                <div class="stat-item">
                    <span class="label">DRI (Followers)</span>
                    <h3>${stats.dri.toLocaleString()}</h3>
                </div>
                <div class="stat-item">
                    <span class="label">PAS (Following)</span>
                    <h3>${stats.pas.toLocaleString()}</h3>
                </div>
                <div class="stat-item">
                    <span class="label">JOINED</span>
                    <h3>${new Date(user.created_at).getFullYear()}</h3>
                </div>
            </div>
            <button class="share-button" onclick="shareCard('${user.login}')">Share Card</button>
        </div>
    `;
    cardContainer.innerHTML = cardHTML;
}




// --- CARD GENERATION ---
generateBtn.addEventListener('click', () =>
generateDisplayCard(usernameInput.value));
benchSearchBtn.addEventListener('click', () =>
addUserToBench(benchSearchInput.value));

// --- Drag & Drop ----
new Sortable(benchList, {
    group: 'dream-team',
    animation: 200,
    forceFallback: true,
    filter: '#bench-placeholder'
});

new Sortable(document.getElementById('dream-team-squad'), {
    group: 'dream-team',
    animation: 200,
    forceFallback: true,
    filter: '.player-slot',
});

// --- Initial Setup ---
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.nav-link[data-page="generator-page"]').classList.add('active');
    document.getElementById('generator-page').classList.add('active');
    loadUserFromURL();
});
