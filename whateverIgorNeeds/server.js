const API_ENDPOINT = 'https://api.lanyard.rest/v1/users/1236215647310975016';
const POLL_INTERVAL = 7000;

let previousData = null;

function formatTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function deepEqual(a, b) {
    if (a === b) return true;

    if (a == null || b == null) return a === b;

    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (!deepEqual(a[i], b[i])) return false;
        }
        return true;
    }

    if (typeof a === 'object' && typeof b === 'object') {
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);

        if (keysA.length !== keysB.length) return false;

        for (const key of keysA) {
            if (!keysB.includes(key)) return false;
            if (!deepEqual(a[key], b[key])) return false;
        }
        return true;
    }

    return false;
}

function logChange(fieldName, oldValue, newValue) {
    const timestamp = formatTimestamp();
    console.log(`[${timestamp}] ${fieldName}: ${JSON.stringify(oldValue)} → ${JSON.stringify(newValue)}`);
}

function compareAndLogChanges(currentData, previousData) {
    const fieldsToTrack = [
        'discord_user',
        'discord_status',
        'activities',
        'active_on_discord_desktop',
        'active_on_discord_mobile',
        'active_on_discord_web',
        'listening_to_spotify',
        'spotify'
    ];

    for (const field of fieldsToTrack) {
        if (currentData.hasOwnProperty(field)) {
            const currentValue = currentData[field];
            const previousValue = previousData ? previousData[field] : undefined;

            if (!deepEqual(currentValue, previousValue)) {
                logChange(field, previousValue, currentValue);
            }
        }
    }
}

async function fetchPresenceData() {
    try {
        const response = await fetch(API_ENDPOINT, {
            headers: {
                'User-Agent': 'Discord-Presence-Tracker/1.0'
            }
        });

        if (!response.ok) {
            console.error(`[${formatTimestamp()}] API request failed with status: ${response.status}`);
            return null;
        }

        const json = await response.json();

        if (!json.success || !json.data) {
            console.error(`[${formatTimestamp()}] API returned error or no data:`, json);
            return null;
        }

        return json.data;
    } catch (error) {
        console.error(`[${formatTimestamp()}] Error fetching data:`, error.message);
        return null;
    }
}

async function pollPresenceData() {
    console.log(`[${formatTimestamp()}] Starting Discord presence tracking...`);

    while (true) {
        const currentData = await fetchPresenceData();

        if (currentData) {
            compareAndLogChanges(currentData, previousData);
            previousData = JSON.parse(JSON.stringify(currentData));
        }

        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
    }
}

pollPresenceData().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
