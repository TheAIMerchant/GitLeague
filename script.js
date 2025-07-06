const usernameInput = document.getElementById('username-input');
const generateBtn = document.getElementById('generate-btn');
const cardContainer = document.getElementById('card-container');

generateBtn.addEventListener('click', generateCard);

async function generateCard() {
    const username = usernameInput.value;
    if(!username) {
        alert("Please enter a GitHub username.")
        return;
    }


    cardContainer.innerHTML = `<p>Generating card for ${username}...<p>`;

    try{
        const response = await fetch(`https://api.github.com/users/${username}`);
        if (!response.ok) {
            throw new Error('User not found!');
        }

        const userData = await response.json();
        displayCard(userData);
    }

    catch (error) {
        cardContainer.innerHTML = `<p style="color: red;">${error.message}</p>`;
    }
}

function displayCard(user) {
    const cardHTML = `
        <div class = "dev-card">
            <h2>${user.name || user.login}</h2>
            <p><strong>Bio:</strong> ${user.bio || 'No bio available.'}</p>
            <p><strong>Followers:</strong> ${user.followers}</p>
            <p><strong>Following:</strong> ${user.following}</p>
            <p><strong>Public Repos:</strong> ${user.public_repos}</p>
        <div>
    `;

    cardContainer.innerHTML = cardHTML;
}