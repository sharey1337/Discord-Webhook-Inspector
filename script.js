document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const themeToggle = document.querySelector('.theme-toggle');
    const lightModeBtn = document.querySelector('.light-mode');
    const darkModeBtn = document.querySelector('.dark-mode');
    const webhookUrlInput = document.getElementById('webhook-url');
    const analyzeBtn = document.getElementById('analyze-btn');
    const demoBtn = document.getElementById('demo-btn');
    const loadingEl = document.getElementById('loading');
    const webhookInfoEl = document.getElementById('webhook-info');
    const errorMessageEl = document.getElementById('error-message');
    
    // Theme Toggle
    if (lightModeBtn && darkModeBtn) {
        lightModeBtn.addEventListener('click', () => {
            document.body.classList.add('light-theme');
            lightModeBtn.classList.add('active');
            darkModeBtn.classList.remove('active');
            localStorage.setItem('theme', 'light');
        });
        
        darkModeBtn.addEventListener('click', () => {
            document.body.classList.remove('light-theme');
            darkModeBtn.classList.add('active');
            lightModeBtn.classList.remove('active');
            localStorage.setItem('theme', 'dark');
        });
    }
    
    // Load saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' && lightModeBtn) {
        lightModeBtn.click();
    }
    
    // Analyze Webhook
    analyzeBtn.addEventListener('click', () => {
        const webhookUrl = webhookUrlInput.value.trim();
        if (!webhookUrl) {
            showError('Please enter a webhook URL');
            return;
        }
        
        analyzeWebhook(webhookUrl);
    });
    
    // Demo Button
    demoBtn.addEventListener('click', () => {
        // Load demo data
        loadDemoData();
    });
    
    // Webhook URL Input - Enter Key
    webhookUrlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            analyzeBtn.click();
        }
    });
    
    // Analyze Webhook Function
    async function analyzeWebhook(url) {
        // Reset UI
        resetUI();
        showLoading();
        
        try {
            // Validate URL format
            if (!isValidWebhookUrl(url)) {
                throw new Error('Invalid webhook URL format');
            }
            
            // Fetch webhook data
            const webhookData = await fetchWebhookData(url);
            
            // Display webhook data
            displayWebhookData(webhookData);
        } catch (error) {
            showError(error.message);
        } finally {
            hideLoading();
        }
    }
    
    // Validate Webhook URL
    function isValidWebhookUrl(url) {
        const webhookRegex = /^https:\/\/discord\.com\/api\/webhooks\/\d+\/[\w-]+$/;
        return webhookRegex.test(url);
    }
    
    // Fetch Webhook Data
    async function fetchWebhookData(url) {
        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Webhook not found. It may have been deleted or the URL is incorrect.');
                } else if (response.status === 401) {
                    throw new Error('Unauthorized. The webhook token may be invalid.');
                } else {
                    throw new Error(`Error fetching webhook: ${response.status} ${response.statusText}`);
                }
            }
            
            return await response.json();
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                throw new Error('Network error. This could be due to CORS restrictions. Try using a proxy or server-side request.');
            }
            throw error;
        }
    }
    
    // Display Webhook Data
    function displayWebhookData(data) {
        // Create webhook info HTML
        const webhookInfoHTML = createWebhookInfoHTML(data);
        
        // Set the HTML and show the info
        webhookInfoEl.innerHTML = webhookInfoHTML;
        webhookInfoEl.style.display = 'block';
        
        // Add event listeners for tabs
        setupTabNavigation();
        
        // Add event listeners for delete webhook button
        setupDeleteWebhook();
        
        // Add event listeners for send spam button
        setupWebhookSpam();
    }
    
    // Setup Tab Navigation
    function setupTabNavigation() {
        const tabItems = document.querySelectorAll('.tab-item');
        const tabPanes = document.querySelectorAll('.tab-pane');
        
        tabItems.forEach(item => {
            item.addEventListener('click', () => {
                // Remove active class from all tabs
                tabItems.forEach(tab => tab.classList.remove('active'));
                tabPanes.forEach(pane => pane.classList.remove('active'));
                
                // Add active class to clicked tab
                item.classList.add('active');
                
                // Show corresponding tab pane
                const tabId = item.getAttribute('data-tab');
                document.getElementById(tabId).classList.add('active');
            });
        });
    }
    
    // Setup Delete Webhook
    function setupDeleteWebhook() {
        const deleteBtn = document.getElementById('delete-webhook-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', async () => {
                const url = deleteBtn.getAttribute('data-url');
                if (!url) {
                    showError('Webhook URL not available');
                    return;
                }
                
                if (confirm('Are you sure you want to delete this webhook? This action cannot be undone.')) {
                    try {
                        const response = await fetch(url, {
                            method: 'DELETE'
                        });
                        
                        if (response.ok) {
                            alert('Webhook deleted successfully!');
                            resetUI();
                            webhookUrlInput.value = '';
                        } else {
                            throw new Error(`Failed to delete webhook: ${response.status} ${response.statusText}`);
                        }
                    } catch (error) {
                        showError(error.message);
                    }
                }
            });
        }
    }
    
    // Setup Webhook Spam
    function setupWebhookSpam() {
        const sendSpamBtn = document.getElementById('send-spam-btn');
        if (sendSpamBtn) {
            sendSpamBtn.addEventListener('click', async () => {
                const url = sendSpamBtn.getAttribute('data-url');
                if (!url) {
                    showError('Webhook URL not available');
                    return;
                }
                
                const messageEl = document.getElementById('spam-message');
                const countEl = document.getElementById('spam-count');
                const delayEl = document.getElementById('spam-delay');
                const usernameEl = document.getElementById('spam-username');
                const avatarEl = document.getElementById('spam-avatar');
                const resultEl = document.getElementById('spam-result');
                
                const message = messageEl.value.trim();
                const count = parseInt(countEl.value) || 1;
                const delay = parseInt(delayEl.value) || 100; // Default to 100ms delay
                const username = usernameEl.value.trim();
                const avatarUrl = avatarEl.value.trim();
                
                if (!message) {
                    showError('Please enter a message to send');
                    return;
                }
                
                if (count < 1 || count > 1000) {
                    showError('Number of messages must be between 1 and 1000');
                    return;
                }
                
                if (delay < 0 || delay > 10000) {
                    showError('Delay must be between 0 and 10000 milliseconds');
                    return;
                }
                
                resultEl.innerHTML = `<div class="sending-status">Sending ${count} messages with ${delay}ms delay between messages...</div>`;
                
                try {
                    let successCount = 0;
                    let attemptCount = 0;
                    let isRunning = true;
                    
                    // Create a progress indicator
                    const progressEl = document.createElement('div');
                    progressEl.className = 'progress-bar';
                    progressEl.innerHTML = `<div class="progress" style="width: 0%"></div>`;
                    resultEl.appendChild(progressEl);
                    
                    const updateProgress = () => {
                        const progressBar = progressEl.querySelector('.progress');
                        const percentage = (successCount / count) * 100;
                        progressBar.style.width = `${percentage}%`;
                        
                        // Update status message
                        const statusEl = resultEl.querySelector('.sending-status');
                        if (statusEl) {
                            statusEl.textContent = `Sending messages: ${successCount} of ${count} sent successfully (${attemptCount} attempts)`;
                        }
                    };
                    
                    // Function to send a single message
                    const sendMessage = async () => {
                        const payload = {
                            content: message
                        };
                        
                        if (username) {
                            payload.username = username;
                        }
                        
                        if (avatarUrl) {
                            payload.avatar_url = avatarUrl;
                        }
                        
                        attemptCount++;
                        
                        try {
                            const response = await fetch(url, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(payload)
                            });
                            
                            if (response.ok) {
                                successCount++;
                                updateProgress();
                                
                                // Check if we've reached the target
                                if (successCount >= count) {
                                    isRunning = false;
                                    resultEl.innerHTML = `<div class="success-status">Successfully sent ${successCount} of ${count} messages (${attemptCount} attempts)</div>`;
                                }
                            }
                        } catch (error) {
                            console.error('Error sending message:', error);
                        }
                    };
                    
                    // Start the sending process
                    const sendLoop = async () => {
                        while (isRunning && successCount < count) {
                            await sendMessage();
                            
                            // Add the specified delay between messages
                            if (isRunning && successCount < count) {
                                await new Promise(resolve => setTimeout(resolve, delay));
                            }
                        }
                    };
                    
                    // Start the sending process
                    sendLoop();
                } catch (error) {
                    resultEl.innerHTML = `<div class="error-status">Error: ${error.message}</div>`;
                }
            });
        }
    }
    
    // Create Webhook Info HTML
    function createWebhookInfoHTML(data) {
        // Extract webhook ID and token from URL
        const webhookId = data.id;
        const partialToken = data.token ? `${data.token.substring(0, 6)}...` : 'N/A';
        const fullToken = data.token || '';
        
        // Format creation date from snowflake ID
        const creationDate = getCreationDateFromId(webhookId);
        
        // Avatar URL
        const avatarUrl = data.avatar 
            ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png` 
            : 'https://cdn.discordapp.com/embed/avatars/0.png';
        
        return `
            <div class="webhook-info-header">
                <img src="${avatarUrl}" alt="Webhook Avatar" class="webhook-avatar">
                <div class="webhook-name">
                    <h3>${data.name || 'Unnamed Webhook'}</h3>
                    <div class="webhook-id">${webhookId}</div>
                </div>
                <div class="webhook-actions">
                    <button id="delete-webhook-btn" class="btn btn-danger" data-url="${data.url || ''}" data-token="${fullToken}">Delete Webhook</button>
                </div>
            </div>
            
            <div class="tabs">
                <div class="tab-header">
                    <div class="tab-item active" data-tab="webhook-details">Webhook Details</div>
                    <div class="tab-item" data-tab="channel-info">Channel Info</div>
                    <div class="tab-item" data-tab="webhook-spam">Webhook Spam</div>
                </div>
                
                <div class="tab-content">
                    <div class="tab-pane active" id="webhook-details">
                        <div class="info-section">
                            <h4>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M12 16V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M12 8H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                Webhook Details
                            </h4>
                            <div class="info-item">
                                <div class="label">Name</div>
                                <div class="value">${data.name || 'Unnamed Webhook'}</div>
                            </div>
                            <div class="info-item">
                                <div class="label">Webhook ID</div>
                                <div class="value monospace">${webhookId}</div>
                            </div>
                            <div class="info-item">
                                <div class="label">Token (Partial)</div>
                                <div class="value monospace">${partialToken}</div>
                            </div>
                            <div class="info-item">
                                <div class="label">Created At</div>
                                <div class="value">${creationDate}</div>
                            </div>
                            <div class="info-item">
                                <div class="label">Type</div>
                                <div class="value">${data.type === 1 ? 'Incoming (Created by user)' : 'Channel Follower'}</div>
                            </div>
                            
                            ${data.user ? `
                            <h4 class="mt-4">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                Creator Information
                            </h4>
                            <div class="info-item">
                                <div class="label">Username</div>
                                <div class="value">${data.user.username || 'N/A'}</div>
                            </div>
                            <div class="info-item">
                                <div class="label">User ID</div>
                                <div class="value monospace">${data.user.id || 'N/A'}</div>
                            </div>
                            <div class="info-item">
                                <div class="label">Avatar</div>
                                <div class="value">${data.user.avatar ? 'Custom' : 'Default'}</div>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="tab-pane" id="channel-info">
                        <div class="info-section">
                            <h4>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                Channel Information
                            </h4>
                            <div class="info-item">
                                <div class="label">Channel ID</div>
                                <div class="value monospace">${data.channel_id || 'N/A'}</div>
                            </div>
                            <div class="info-item">
                                <div class="label">Guild (Server) ID</div>
                                <div class="value monospace">${data.guild_id || 'N/A'}</div>
                            </div>
                            <div class="info-item">
                                <div class="label">Application ID</div>
                                <div class="value monospace">${data.application_id || 'N/A'}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="tab-pane" id="webhook-spam">
                        <div class="spam-section">
                            <h4>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M22 6L12 13L2 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                Webhook Spam
                            </h4>
                            <div class="spam-form">
                                <div class="form-group">
                                    <label for="spam-message">Message</label>
                                    <textarea id="spam-message" placeholder="Enter message to send" rows="4"></textarea>
                                </div>
                                <div class="form-group">
                                    <label for="spam-count">Number of Messages</label>
                                    <input type="number" id="spam-count" min="1" max="1000" value="1">
                                </div>
                                <div class="form-group">
                                    <label for="spam-delay">Delay Between Messages (ms)</label>
                                    <input type="number" id="spam-delay" min="0" max="10000" value="100">
                                </div>
                                <div class="form-group">
                                    <label for="spam-username">Username (Optional)</label>
                                    <input type="text" id="spam-username" placeholder="Custom username">
                                </div>
                                <div class="form-group">
                                    <label for="spam-avatar">Avatar URL (Optional)</label>
                                    <input type="text" id="spam-avatar" placeholder="Custom avatar URL">
                                </div>
                                <button id="send-spam-btn" class="btn btn-primary" data-url="${data.url || ''}">Send Messages</button>
                            </div>
                            <div id="spam-result" class="spam-result"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Get Creation Date from Snowflake ID
    function getCreationDateFromId(id) {
        // Discord Epoch (2015-01-01T00:00:00.000Z)
        const DISCORD_EPOCH = 1420070400000;
        
        // Convert snowflake to timestamp
        const timestamp = (BigInt(id) >> 22n) + BigInt(DISCORD_EPOCH);
        
        // Create date object
        const date = new Date(Number(timestamp));
        
        // Format date
        return date.toLocaleString();
    }
    
    // Load Demo Data
    function loadDemoData() {
        const demoData = {
            id: '1098765432109876543',
            name: 'Sample Webhook',
            avatar: null,
            channel_id: '9876543210987654321',
            guild_id: '8765432109876543210',
            application_id: null,
            token: 'samp...1234',
            type: 1,
            user: {
                id: '1234567890123456789',
                username: 'SampleUser',
                avatar: null
            }
        };
        
        resetUI();
        displayWebhookData(demoData);
    }
    
    // Show Loading
    function showLoading() {
        loadingEl.style.display = 'flex';
    }
    
    // Hide Loading
    function hideLoading() {
        loadingEl.style.display = 'none';
    }
    
    // Show Error
    function showError(message) {
        errorMessageEl.textContent = message;
        errorMessageEl.style.display = 'block';
    }
    
    // Reset UI
    function resetUI() {
        webhookInfoEl.style.display = 'none';
        errorMessageEl.style.display = 'none';
        webhookInfoEl.innerHTML = '';
    }
});
