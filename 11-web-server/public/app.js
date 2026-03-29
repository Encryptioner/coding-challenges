// JavaScript loaded from our custom web server

console.log('Web server JavaScript is running!');

// Add dynamic behavior
document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.container');

    // Add a timestamp
    const timestamp = document.createElement('p');
    timestamp.style.color = '#888';
    timestamp.style.fontSize = '0.9em';
    timestamp.style.marginTop = '20px';
    timestamp.textContent = 'Page loaded at: ' + new Date().toLocaleString();
    container.appendChild(timestamp);

    // Add hover effect
    container.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-5px)';
    });

    container.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
    });

    // Log that everything works
    console.log('✅ HTML loaded');
    console.log('✅ CSS loaded');
    console.log('✅ JavaScript executed');
    console.log('✅ All resources served successfully!');
});

// Test fetch to non-existent endpoint (will show 404)
fetch('/api/test')
    .then(response => {
        console.log('Fetch response status:', response.status);
        return response.text();
    })
    .then(text => {
        console.log('Fetch response:', text);
    })
    .catch(error => {
        console.error('Fetch error:', error);
    });
