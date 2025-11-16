// Main site JavaScript

document.addEventListener('DOMContentLoaded', () => {
    initFilters();
});

function initFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const challengeCards = document.querySelectorAll('.challenge-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const filter = button.dataset.filter;

            // Filter cards
            challengeCards.forEach(card => {
                const tags = card.dataset.tags || '';

                if (filter === 'all') {
                    card.classList.remove('hidden');
                } else if (tags.includes(filter)) {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                }
            });
        });
    });
}
