const DISCORD_API = 'https://api.lanyard.rest/v1/users/1236215647310975016';

let currentPresenceData = null;
let gameStartTime = null;

function formatElapsedTime() {
    if (!gameStartTime) return '';

    const now = new Date();
    const elapsedSeconds = Math.floor((now - gameStartTime) / 1000);

    if (elapsedSeconds <= 0) return '';

    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    } else {
        return `${seconds}s`;
    }
}

function updatePresenceDisplay() {
    const presenceActivity = document.getElementById('presenceActivity');

    if (!currentPresenceData) {
        presenceActivity.textContent = 'Unable to load presence data';
        return;
    }

    const activities = currentPresenceData.activities || [];
    const mainActivity = activities.find(activity => activity.type === 0);
    let activityText = '';

    if (currentPresenceData.listening_to_spotify && currentPresenceData.spotify) {
        activityText = `🎵 Listening to "${currentPresenceData.spotify.song}" by ${currentPresenceData.spotify.artist}`;
    }
    else if (mainActivity) {
        let gameText = `Playing ${mainActivity.name}`;
        const timeStr = formatElapsedTime();
        if (timeStr) {
            gameText += ` (${timeStr})`;
        }
        activityText = gameText;
    }

    if (!activityText) {
        activityText = 'No current activity';
    }

    presenceActivity.textContent = activityText;
}

async function fetchPresence() {
    try {
        const response = await fetch(DISCORD_API);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const json = await response.json();

        if (json.success && json.data) {
            currentPresenceData = json.data;

            const activities = json.data.activities || [];
            const mainActivity = activities.find(activity => activity.type === 0);

            if (mainActivity && mainActivity.timestamps && mainActivity.timestamps.start) {
                const newStartTime = new Date(mainActivity.timestamps.start);
                if (!gameStartTime || Math.abs(newStartTime - gameStartTime) > 5000) {
                    gameStartTime = newStartTime;
                }
            } else {
                gameStartTime = null;
            }
        } else {
            currentPresenceData = null;
            gameStartTime = null;
        }
    } catch (error) {
        console.error('Error fetching Discord presence:', error);
        currentPresenceData = null;
        gameStartTime = null;
    }
}

fetchPresence().then(() => {
    updatePresenceDisplay();
});

setInterval(fetchPresence, 60000);

setInterval(updatePresenceDisplay, 1000);
