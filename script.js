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
const teamScoreDisplay = document.getElementById('team-score');
const teamSquadSlots = document.querySelectorAll('.player-slot');
const shareTeamBtn = document.getElementById('share-team-btn');

const POSITION_MAP = {
    'CEO': 'ceo',
    'Lead frontend': 'lf',
    'Lead Backend': 'lb',
    'DevOps': 'do'
};

let leaderboard = [
    {login: 'torvalds', name: 'Linus Torvalds', score: 99},
    {login: 'gaearon', name: 'dan', score: 96},
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
        updatePlaceholderVisibility();
    });
});

async function fetchUserData(username) {
    const response = await fetch(`https://api.github.com/users/${username}`);
    if (!response.ok) throw new Error('User not found!');
    return await response.json();
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
        const userSummary = {login: userData.login, name: userData.name, score: stats.ovr};
        const leaderIndex = leaderboard.findIndex(u => u.login.toLowerCase() === userSummary.login.toLowerCase());
            if (leaderIndex > -1) {
                leaderboard[leaderIndex] = userSummary;
            }
            else {
                leaderboard.push(userSummary);
            }
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
        const identiconUrl = `https://github.com/identicons/${userData.login}.png`; 
        const userSummary = {login: userData.login, name: userData.name, score: stats.ovr};
        const leaderIndex = leaderboard.findIndex(u => u.login.toLowerCase() === userSummary.login.toLowerCase());
            if (leaderIndex > -1) {
                leaderboard[leaderIndex] = userSummary;
            }
            else {
                leaderboard.push(userSummary);
            }
        benchPlayers.push(userData);
        const benchCard = document.createElement('div');
        benchCard.className = 'dev-card-small';
        benchCard.dataset.ovr = stats.ovr;
        benchCard.dataset.username = userData.login;
        benchCard.innerHTML = `<img src="${identiconUrl}" alt="${userData.login}" class="dev-card-identicon"<p>${userData.name || userData.login}</p><span>OVR: ${stats.ovr}</span>`;
        benchList.appendChild(benchCard);
        updatePlaceholderVisibility();
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

// --- Share Dream Team ---
function shareDreamTeam() {
    const teamParams = [];
    teamSquadSlots.forEach(slot => {
        const card = slot.querySelector('.dev-card-small');
        if (card) {
            const position = slot.dataset.position;
            const shortCode = POSITION_MAP[position];
            const username = card.dataset.username;
            if (shortCode && username) {
                teamParams.push(`${shortCode}:${username}`);
            }
        }
    });
    if (teamParams.length === 0) {
        alert("Add some players to your team before sharing!");
        return;
    }
    const url = `${window.location.origin}${window.location.pathname}?team=${teamParams.join(',')}`;
    navigator.clipboard.writeText(url).then(() => {
        alert('Dream Team share link copied to clipboard!');
    });
}

// --- Load Dream Team from URL ---
async function loadTeamFromURL() {
    const params = new URLSearchParams(window.location.search);
    const teamData = params.get('team');
    if (!teamData) return;

    document.querySelector('.nav-link[data-page="team-builder-page"]').click();
    const reversePositionMap = Object.fromEntries(
        Object.entries(POSITION_MAP).map(([key, value]) => [value, key])
    );
    const players = teamData.split(',');
    const playerPromises = players.map(playerString => {
        const [shortCode, username] = playerString.split(':');
        const position = reversePositionMap[shortCode];
        const targetSlot = document.querySelector(`.player-slot[data-position="${position}"]`);
        if (targetSlot && username) {
            return fetchUserData(username).then(userData => {
                const stats = calculateStats(userData);
                const card = document.createElement('div');
                card.className = 'dev-card-small';
                card.dataset.ovr = stats.ovr;
                card.dataset.username = userData.login;
                card.innerHTML = `<img src="${identiconUrl}" alt="${userData.login}" class="dev-card-identicon"><p>${userData.name || userData.login}</p><span>OVR: ${stats.ovr}</span>`;
                targetSlot.appendChild(card);
                targetSlot.classList.add('filled');
                })
                .catch(error => console.error(`Could not load player ${username}:`, error));
            }
            return Promise.resolve();
        });
    await Promise.all(playerPromises);    
    calculateTeamOVR();      
        
}

// --- Function to load user from url ---
async function loadUserFromURL () {
    const params = new URLSearchParams(window.location.search);
    const username = params.get('user');
    if (username) {
        usernameInput.value = username;
        return generateDisplayCard(username);
    }
}

// --- Function to calculate and display the team's average OVR  ---
function calculateTeamOVR() {
    const playersInSquad = document.querySelectorAll('#dream-team-squad .dev-card-small');

    if (playersInSquad.length === 0) {
        teamScoreDisplay.textContent = '0';
        return;
    }

    let totalScore = 0;
    playersInSquad.forEach(playerCard => {
        totalScore += parseInt(playerCard.dataset.ovr);
    });

    const averageScore = Math.round(totalScore / playersInSquad.length);
    teamScoreDisplay.textContent = averageScore;
}

// --- Function to handle the placeholder visibility ---
function updatePlaceholderVisibility() {
    const visibleCardsInBench = benchList.querySelectorAll('.dev-card-small:not(.sortable-drag').length;
    benchPlaceholder.style.display = visibleCardsInBench > 0 ? 'none' : 'block';
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

// --- Event Listeners ---
generateBtn.addEventListener('click', () =>
generateDisplayCard(usernameInput.value));
benchSearchBtn.addEventListener('click', () =>
addUserToBench(benchSearchInput.value));
shareTeamBtn.addEventListener('click', shareDreamTeam);

// --- Drag & Drop ----
let mouseMoveHandler = null;
let lastHoveredSlot =null;

const sortableOptions = {
    group: 'dream-team',
    animation: 0,
    forceFallback: true,
    fallbackOnBody: true,
    ghostClass: "sortable-ghost",
    fallbackClass: "sortable-fallback",
    dragClass: "sortable-drag",

    onStart: function (evt) {
        const sourceSlot = evt.from;
        if (sourceSlot.classList.contains('player-slot')) {
            sourceSlot.classList.remove('filled');
        }
        const fallbackElement = evt.clone;
        mouseMoveHandler = (e) => {
            const offsetX = fallbackElement.offsetWidth / 2;
            const offsetY = fallbackElement.offsetHeight / 2;
            fallbackElement.style.left = `${e.clientX - offsetX}px`;
            fallbackElement.style.top = `${e.clientY - offsetY}px`;
        };
        document.addEventListener('pointermove', mouseMoveHandler);
        setTimeout(() => {
            updatePlaceholderVisibility();
        }, 0);
    },

    onMove: function(evt) {
        const targetSlot = evt.to;
        setTimeout(() => {
            updatePlaceholderVisibility();
        }, 0);
        if (targetSlot === benchList) {
            benchPlaceholder.style.display = 'none';
        }
        if (targetSlot.classList.contains('player-slot') && targetSlot !== lastHoveredSlot) {
            if (lastHoveredSlot) {
                lastHoveredSlot.classList.remove('drag-over');
            }
            targetSlot.classList.remove('drag-over');
            lastHoveredSlot = targetSlot;
        }
        else if (!targetSlot.classList.contains('player-slot')) {
            if (lastHoveredSlot) {
                lastHoveredSlot.classList.remove('drag-over');
                lastHoveredSlot = null;
            }
        }
    },

    onEnd: function(evt) {
        if (mouseMoveHandler) {
            document.removeEventListener('pointermove', mouseMoveHandler);
            mouseMoveHandler = null;
        }
        if (lastHoveredSlot) {
            lastHoveredSlot.classList.remove('drag-over');
            lastHoveredSlot = null;
        }
        const finalSlot = evt.to;
        if (finalSlot.classList.contains('player-slot') && finalSlot.children.length > 0) {
            finalSlot.classList.add('filled');
        }
        const fromContainer = evt.from;
        if (fromContainer.classList.contains('player-slot') && fromContainer.children.length === 0) {
            if(fromContainer.children.length === 0) {
                fromContainer.classList.remove('filled');
            }
        }
        setTimeout(() => {
            calculateTeamOVR();
            updatePlaceholderVisibility();
        }, 0);
    }
};

new Sortable(benchList, {
    ...sortableOptions
});

teamSquadSlots.forEach(slot => {
    new Sortable(slot, {
        ...sortableOptions,
        onAdd: function (evt) {
            const targetSlot = evt.to;
            const draggedItem = evt.item;
            const sourceContainer = evt.from;

            if (targetSlot.children.length > 1) {
                const oldCard = Array.from(targetSlot.children).find(child => child !==draggedItem);
                if (oldCard) {
                    if(sourceContainer.classList.contains('player-slot')) {
                        sourceContainer.appendChild(oldCard);
                    }

                    else {
                        benchList.appendChild(oldCard);
                    }
                }
            }
        },
    });
});

// --- Initial Setup ---
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.nav-link[data-page="generator-page"]').classList.add('active');
    document.getElementById('generator-page').classList.add('active');
    const params = new URLSearchParams(window.location.search);
    if (params.has('team')) {
        loadTeamFromURL();
    }
    else if (params.has('user')) {
        loadUserFromURL();
    }
    updatePlaceholderVisibility();
});