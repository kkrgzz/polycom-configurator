/**
 * UI Utility Functions
 * Clock, buttons, and other UI helpers
 */

/**
 * Start the live clock display
 */
export function startClock() {
    function updateClock() {
        const d = new Date();
        const clockElement = document.getElementById('liveClock');
        if (clockElement) {
            clockElement.textContent = d.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }

    // Update immediately and then every second
    updateClock();
    setInterval(updateClock, 1000);
}

/**
 * Render physical phone buttons
 */
export function renderButtons() {
    const buttonHTML = '<div class="p-btn-group"><div class="p-led"></div><div class="p-btn"></div></div>'.repeat(6);

    const leftButtons = document.getElementById('pbtn-left');
    const rightButtons = document.getElementById('pbtn-right');

    if (leftButtons) {
        leftButtons.innerHTML = buttonHTML;
    }

    if (rightButtons) {
        rightButtons.innerHTML = buttonHTML;
    }
}
