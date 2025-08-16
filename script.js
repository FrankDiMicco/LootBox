class LootboxApp {
    constructor() {
        this.currentLootbox = {
            name: 'Default Box',
            items: [
                { name: 'Common Item', odds: 0.6 },
                { name: 'Rare Item', odds: 0.3 },
                { name: 'Epic Item', odds: 0.1 }
            ],
            revealContents: true,
            revealOdds: true,
            maxTries: "unlimited",
            remainingTries: "unlimited"
        };
        
        this.isEditing = false;
        this.oddsWarningIgnored = false;
        this.cooldownTimer = null;
        this.resultTimer = null;
        this.sessionHistory = [];
        this.previousLootbox = null;
        
        this.initializeElements();
        this.attachEventListeners();
        this.updateCurrentBoxDisplay();
        this.updateSessionDisplay();
    }
    
    initializeElements() {
        this.elements = {
            openBox: document.getElementById('openBox'),
            editBox: document.getElementById('editBox'),
            createBox: document.getElementById('createBox'),
            saveBox: document.getElementById('saveBox'),
            loadBox: document.getElementById('loadBox'),
            
            warning: document.getElementById('warning'),
            proceedAnyway: document.getElementById('proceedAnyway'),
            
            result: document.getElementById('result'),
            resultItem: document.getElementById('resultItem'),
            
            editor: document.getElementById('editor'),
            boxName: document.getElementById('boxName'),
            revealContents: document.getElementById('revealContents'),
            revealOdds: document.getElementById('revealOdds'),
            unlimitedTries: document.getElementById('unlimitedTries'),
            maxTriesInput: document.getElementById('maxTriesInput'),
            addItem: document.getElementById('addItem'),
            itemsList: document.getElementById('itemsList'),
            totalOdds: document.getElementById('totalOdds'),
            saveChanges: document.getElementById('saveChanges'),
            cancelEdit: document.getElementById('cancelEdit'),
            
            currentBox: document.getElementById('currentBox'),
            currentBoxName: document.getElementById('currentBoxName'),
            currentItems: document.getElementById('currentItems'),
            triesRemaining: document.getElementById('triesRemaining'),
            clearHistory: document.getElementById('clearHistory'),
            
            sessionHistory: document.getElementById('sessionHistory'),
            sessionToggle: document.getElementById('sessionToggle'),
            toggleButton: document.getElementById('toggleButton'),
            sessionContent: document.getElementById('sessionContent'),
            sessionStats: document.getElementById('sessionStats'),
            totalPulls: document.getElementById('totalPulls'),
            historyList: document.getElementById('historyList'),
            
            loadModal: document.getElementById('loadModal'),
            closeModal: document.getElementById('closeModal'),
            savedLootboxes: document.getElementById('savedLootboxes')
        };
    }
    
    attachEventListeners() {
        this.elements.openBox.addEventListener('click', () => this.openLootbox());
        this.elements.editBox.addEventListener('click', () => this.editLootbox());
        this.elements.createBox.addEventListener('click', () => this.createNewLootbox());
        this.elements.saveBox.addEventListener('click', () => this.saveLootbox());
        this.elements.loadBox.addEventListener('click', () => this.loadLootbox());
        
        this.elements.sessionToggle.addEventListener('click', () => this.toggleSessionHistory());
        
        this.elements.proceedAnyway.addEventListener('click', () => this.proceedWithWarning());
        
        this.elements.addItem.addEventListener('click', () => this.addItemRow());
        this.elements.saveChanges.addEventListener('click', () => this.saveChanges());
        this.elements.cancelEdit.addEventListener('click', () => this.cancelEdit());
        this.elements.clearHistory.addEventListener('click', () => this.clearHistory());
        
        this.elements.revealContents.addEventListener('change', () => this.updateCurrentBoxDisplay());
        this.elements.revealOdds.addEventListener('change', () => this.updateCurrentBoxDisplay());
        
        this.elements.unlimitedTries.addEventListener('change', () => this.toggleTriesInput());
        this.elements.maxTriesInput.addEventListener('input', () => this.updateTriesDisplay());
        
        this.elements.closeModal.addEventListener('click', () => this.closeLoadModal());
        this.elements.loadModal.addEventListener('click', (e) => {
            if (e.target === this.elements.loadModal) {
                this.closeLoadModal();
            }
        });
    }
    
    openLootbox() {
        if (!this.canOpenLootbox()) {
            return;
        }
        
        if (!this.validateOdds() && !this.oddsWarningIgnored) {
            this.showWarning();
            return;
        }
        
        // Clear any existing timers
        this.clearTimers();
        
        const result = this.rollLootbox();
        this.decrementTries();
        this.addToHistory(result);
        this.displayResult(result);
        this.updateCurrentBoxDisplay();
        this.startCooldown();
    }
    
    clearTimers() {
        if (this.cooldownTimer) {
            clearTimeout(this.cooldownTimer);
            this.cooldownTimer = null;
        }
        if (this.resultTimer) {
            clearTimeout(this.resultTimer);
            this.resultTimer = null;
        }
    }
    
    startCooldown() {
        this.elements.openBox.disabled = true;
        this.elements.openBox.textContent = 'Opening...';
        
        this.cooldownTimer = setTimeout(() => {
            this.elements.openBox.disabled = false;
            this.elements.openBox.textContent = 'Open';
            this.cooldownTimer = null;
            this.updateOpenButtonState(); // Recheck if tries are exhausted
        }, 1000);
    }
    
    canOpenLootbox() {
        // Check if on cooldown
        if (this.cooldownTimer) {
            return false;
        }
        
        if (this.currentLootbox.remainingTries === "unlimited") {
            return true;
        }
        
        if (this.currentLootbox.remainingTries <= 0) {
            this.showMessage('No tries remaining! Reset tries to continue.', 'error');
            return false;
        }
        
        return true;
    }
    
    decrementTries() {
        if (this.currentLootbox.remainingTries !== "unlimited") {
            this.currentLootbox.remainingTries--;
            this.updateOpenButtonState();
        }
    }
    
    updateOpenButtonState() {
        const hasTriesRemaining = this.currentLootbox.remainingTries === "unlimited" || this.currentLootbox.remainingTries > 0;
        const isOnCooldown = this.cooldownTimer !== null;
        const isEditing = this.isEditing;
        const canOpen = hasTriesRemaining && !isOnCooldown && !isEditing;
        
        this.elements.openBox.disabled = !canOpen;
        
        if (isEditing) {
            this.elements.openBox.style.opacity = '0.5';
            this.elements.openBox.style.cursor = 'not-allowed';
            this.elements.openBox.textContent = 'Editing...';
        } else if (!hasTriesRemaining) {
            this.elements.openBox.style.opacity = '0.5';
            this.elements.openBox.style.cursor = 'not-allowed';
            this.elements.openBox.textContent = 'No Tries Left';
        } else if (isOnCooldown) {
            this.elements.openBox.style.opacity = '0.7';
            this.elements.openBox.style.cursor = 'not-allowed';
            // Text is already set to 'Opening...' in startCooldown()
        } else {
            this.elements.openBox.style.opacity = '1';
            this.elements.openBox.style.cursor = 'pointer';
            this.elements.openBox.textContent = 'Open';
        }
    }
    
    rollLootbox() {
        const random = Math.random();
        let cumulativeOdds = 0;
        
        for (const item of this.currentLootbox.items) {
            cumulativeOdds += item.odds;
            if (random <= cumulativeOdds) {
                return item.name;
            }
        }
        
        return this.currentLootbox.items[this.currentLootbox.items.length - 1]?.name || 'Nothing';
    }
    
    displayResult(itemName) {
        this.elements.resultItem.textContent = itemName;
        this.elements.result.classList.remove('hidden');
        
        this.resultTimer = setTimeout(() => {
            this.elements.result.classList.add('hidden');
            this.resultTimer = null;
        }, 3000);
    }
    
    editLootbox() {
        // If already editing, close the editor
        if (this.isEditing) {
            this.cancelEdit();
            return;
        }
        
        this.isEditing = true;
        this.oddsWarningIgnored = false;
        this.elements.boxName.value = this.currentLootbox.name;
        this.elements.revealContents.checked = this.currentLootbox.revealContents !== false;
        this.elements.revealOdds.checked = this.currentLootbox.revealOdds !== false;
        
        // Set tries controls
        const isUnlimited = this.currentLootbox.maxTries === "unlimited";
        this.elements.unlimitedTries.checked = isUnlimited;
        this.elements.maxTriesInput.disabled = isUnlimited;
        this.elements.maxTriesInput.value = isUnlimited ? 10 : this.currentLootbox.maxTries;
        
        this.populateItemsList();
        this.elements.editor.classList.remove('hidden');
        this.updateTotalOdds();
        this.updateOpenButtonState();
        this.updateMainButtonsState();
    }
    
    createNewLootbox() {
        // Check if we're already creating a new lootbox (same data structure)
        const isCreatingNew = this.isEditing && this.currentLootbox.name === 'New Lootbox' && 
                              this.currentLootbox.items.length === 1 && 
                              this.currentLootbox.items[0].name === 'Default Item';
        
        // If already creating new lootbox, just close the editor
        if (isCreatingNew) {
            this.cancelEdit();
            return;
        }
        
        // If editing, close first
        if (this.isEditing) {
            this.isEditing = false;
            this.elements.editor.classList.add('hidden');
            this.elements.warning.classList.add('hidden');
        }
        
        this.currentLootbox = {
            name: 'New Lootbox',
            items: [
                { name: 'Default Item', odds: 1.0 }
            ],
            revealContents: true,
            revealOdds: true,
            maxTries: "unlimited",
            remainingTries: "unlimited"
        };
        this.oddsWarningIgnored = false;
        this.updateCurrentBoxDisplay();
        
        // Open the editor for the new lootbox
        this.isEditing = true;
        this.elements.boxName.value = this.currentLootbox.name;
        this.elements.revealContents.checked = this.currentLootbox.revealContents !== false;
        this.elements.revealOdds.checked = this.currentLootbox.revealOdds !== false;
        
        // Set tries controls
        const isUnlimited = this.currentLootbox.maxTries === "unlimited";
        this.elements.unlimitedTries.checked = isUnlimited;
        this.elements.maxTriesInput.disabled = isUnlimited;
        this.elements.maxTriesInput.value = isUnlimited ? 10 : this.currentLootbox.maxTries;
        
        this.populateItemsList();
        this.elements.editor.classList.remove('hidden');
        this.updateTotalOdds();
        this.updateOpenButtonState();
        this.updateMainButtonsState();
    }
    
    populateItemsList() {
        this.elements.itemsList.innerHTML = '';
        this.currentLootbox.items.forEach((item, index) => {
            this.addItemRow(item, index);
        });
    }
    
    addItemRow(item = { name: '', odds: 0 }, index = null) {
        const row = document.createElement('div');
        row.className = 'item-row';
        row.innerHTML = `
            <input type="text" placeholder="Item name" value="${item.name}" class="item-name">
            <input type="number" step="0.01" min="0" max="1" placeholder="0.00" value="${item.odds}" class="item-odds">
            <button class="remove-item" onclick="this.parentElement.remove(); app.updateTotalOdds();">Remove</button>
        `;
        
        const nameInput = row.querySelector('.item-name');
        const oddsInput = row.querySelector('.item-odds');
        
        nameInput.addEventListener('input', () => this.updateTotalOdds());
        oddsInput.addEventListener('input', () => this.updateTotalOdds());
        
        this.elements.itemsList.appendChild(row);
        this.updateTotalOdds();
    }
    
    updateTotalOdds() {
        const rows = this.elements.itemsList.querySelectorAll('.item-row');
        let total = 0;
        
        rows.forEach(row => {
            const oddsInput = row.querySelector('.item-odds');
            const odds = parseFloat(oddsInput.value) || 0;
            total += odds;
        });
        
        this.elements.totalOdds.textContent = total.toFixed(3);
        
        if (Math.abs(total - 1.0) > 0.001) {
            this.elements.totalOdds.style.color = '#dc3545';
        } else {
            this.elements.totalOdds.style.color = '#28a745';
        }
    }
    
    saveChanges() {
        const rows = this.elements.itemsList.querySelectorAll('.item-row');
        const items = [];
        
        rows.forEach(row => {
            const nameInput = row.querySelector('.item-name');
            const oddsInput = row.querySelector('.item-odds');
            
            const name = nameInput.value.trim();
            const odds = parseFloat(oddsInput.value) || 0;
            
            if (name) {
                items.push({ name, odds });
            }
        });
        
        if (items.length === 0) {
            this.showMessage('Please add at least one item.', 'error');
            return;
        }
        
        this.currentLootbox.name = this.elements.boxName.value.trim() || 'Unnamed Lootbox';
        this.currentLootbox.items = items;
        this.currentLootbox.revealContents = this.elements.revealContents.checked;
        this.currentLootbox.revealOdds = this.elements.revealOdds.checked;
        
        // Update tries settings
        if (this.elements.unlimitedTries.checked) {
            this.currentLootbox.maxTries = "unlimited";
            this.currentLootbox.remainingTries = "unlimited";
        } else {
            const maxTries = parseInt(this.elements.maxTriesInput.value) || 1;
            this.currentLootbox.maxTries = maxTries;
            this.currentLootbox.remainingTries = maxTries;
        }
        
        this.isEditing = false;
        this.oddsWarningIgnored = false;
        this.elements.editor.classList.add('hidden');
        this.elements.warning.classList.add('hidden');
        this.updateCurrentBoxDisplay();
        
        // Auto-save to localStorage when changes are saved
        this.saveLootbox();
        this.showMessage('Lootbox changes saved!', 'success');
        this.updateOpenButtonState();
    }
    
    cancelEdit() {
        this.isEditing = false;
        this.oddsWarningIgnored = false;
        this.elements.editor.classList.add('hidden');
        this.elements.warning.classList.add('hidden');
        this.updateOpenButtonState();
        this.updateMainButtonsState();
    }
    
    validateOdds() {
        const total = this.currentLootbox.items.reduce((sum, item) => sum + item.odds, 0);
        return Math.abs(total - 1.0) <= 0.001;
    }
    
    showWarning() {
        this.elements.warning.classList.remove('hidden');
    }
    
    proceedWithWarning() {
        this.oddsWarningIgnored = true;
        this.elements.warning.classList.add('hidden');
        this.openLootbox();
    }
    
    showMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        
        document.querySelector('.container').insertBefore(messageDiv, document.querySelector('.main-controls'));
        
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
    
    updateCurrentBoxDisplay() {
        this.elements.currentBoxName.textContent = this.currentLootbox.name;
        this.elements.currentItems.innerHTML = '';
        
        // Update tries display
        this.updateTriesDisplay();
        
        const revealContents = this.isEditing ? this.elements.revealContents.checked : this.currentLootbox.revealContents;
        const revealOdds = this.isEditing ? this.elements.revealOdds.checked : this.currentLootbox.revealOdds;
        
        if (!revealContents && !revealOdds) {
            return;
        }
        
        const sortedItems = [...this.currentLootbox.items].sort((a, b) => b.odds - a.odds);
        
        sortedItems.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'current-item';
            
            if (revealContents && revealOdds) {
                itemElement.innerHTML = `
                    <div class="current-item-name">${item.name}</div>
                    <div class="current-item-odds">${(item.odds * 100).toFixed(1)}%</div>
                `;
            } else if (revealContents && !revealOdds) {
                itemElement.innerHTML = `
                    <div class="current-item-name">${item.name}</div>
                `;
            } else if (!revealContents && revealOdds) {
                itemElement.innerHTML = `
                    <div class="current-item-odds">${(item.odds * 100).toFixed(1)}%</div>
                `;
            }
            
            this.elements.currentItems.appendChild(itemElement);
        });
    }
    
    updateTriesDisplay() {
        if (this.currentLootbox.remainingTries === "unlimited") {
            this.elements.triesRemaining.textContent = "Unlimited tries";
        } else {
            this.elements.triesRemaining.textContent = `Tries remaining: ${this.currentLootbox.remainingTries}`;
        }
        this.updateOpenButtonState();
    }
    
    toggleTriesInput() {
        const isUnlimited = this.elements.unlimitedTries.checked;
        this.elements.maxTriesInput.disabled = isUnlimited;
        
        if (isUnlimited) {
            this.elements.maxTriesInput.value = 10;
        }
    }
    
    resetTries() {
        this.currentLootbox.remainingTries = this.currentLootbox.maxTries;
        this.updateCurrentBoxDisplay();
        this.showMessage('Tries reset successfully!', 'success');
    }
    
    updateMainButtonsState() {
        const isCreatingNew = this.isEditing && this.currentLootbox.name === 'New Lootbox' && 
                              this.currentLootbox.items.length === 1 && 
                              this.currentLootbox.items[0].name === 'Default Item';
        
        // Disable all main buttons except the active one when editing
        if (this.isEditing) {
            this.elements.openBox.disabled = true;
            this.elements.saveBox.disabled = true;
            this.elements.loadBox.disabled = true;
            
            if (isCreatingNew) {
                // When creating new, only "Create New Lootbox" is enabled
                this.elements.editBox.disabled = true;
                this.elements.createBox.disabled = false;
            } else {
                // When editing existing, only "Edit Lootbox" is enabled
                this.elements.editBox.disabled = false;
                this.elements.createBox.disabled = true;
            }
            
            // Make lootbox and history sections inactive
            this.elements.currentBox.classList.add('inactive');
            this.elements.sessionHistory.classList.add('inactive');
        } else {
            // Enable all buttons when not editing
            this.elements.editBox.disabled = false;
            this.elements.createBox.disabled = false;
            this.elements.saveBox.disabled = false;
            this.elements.loadBox.disabled = false;
            // Note: openBox state is handled by updateOpenButtonState()
            
            // Make lootbox and history sections active
            this.elements.currentBox.classList.remove('inactive');
            this.elements.sessionHistory.classList.remove('inactive');
        }
    }
    
    saveLootbox() {
        const lootboxData = {
            ...this.currentLootbox,
            lastUpdated: new Date().toISOString()
        };
        
        try {
            localStorage.setItem(`lootbox_${this.currentLootbox.name}`, JSON.stringify(lootboxData));
            // Only show message if called directly (not from saveChanges)
            if (!this.isEditing) {
                this.showMessage('Lootbox saved successfully!', 'success');
            }
        } catch (error) {
            this.showMessage('Error saving lootbox: ' + error.message, 'error');
        }
    }
    
    loadLootbox() {
        this.populateLoadModal();
        this.elements.loadModal.classList.remove('hidden');
    }
    
    populateLoadModal() {
        const savedLootboxes = this.getSavedLootboxes();
        this.elements.savedLootboxes.innerHTML = '';
        
        if (savedLootboxes.length === 0) {
            this.elements.savedLootboxes.innerHTML = '<div class="no-saved">No saved lootboxes found.</div>';
            return;
        }
        
        savedLootboxes.forEach(lootbox => {
            const itemElement = document.createElement('div');
            itemElement.className = 'saved-item';
            itemElement.innerHTML = `
                <div class="saved-item-info">
                    <div class="saved-item-name">${lootbox.name}</div>
                    <div class="saved-item-date">Last modified: ${new Date(lootbox.lastUpdated).toLocaleString()}</div>
                </div>
                <div class="saved-item-controls">
                    <button class="btn-load" onclick="app.loadSavedLootbox('${lootbox.name}')">Load</button>
                    <button class="btn-delete" onclick="app.deleteSavedLootbox('${lootbox.name}')">Delete</button>
                </div>
            `;
            this.elements.savedLootboxes.appendChild(itemElement);
        });
    }
    
    getSavedLootboxes() {
        const lootboxes = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('lootbox_')) {
                try {
                    const lootboxData = JSON.parse(localStorage.getItem(key));
                    lootboxes.push(lootboxData);
                } catch (error) {
                    console.error('Error parsing saved lootbox:', error);
                }
            }
        }
        return lootboxes.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
    }
    
    loadSavedLootbox(name) {
        try {
            const savedData = localStorage.getItem(`lootbox_${name}`);
            if (savedData) {
                const lootbox = JSON.parse(savedData);
                this.currentLootbox = {
                    ...lootbox,
                    revealContents: lootbox.revealContents !== false,
                    revealOdds: lootbox.revealOdds !== false,
                    maxTries: lootbox.maxTries || "unlimited",
                    remainingTries: lootbox.remainingTries || "unlimited"
                };
                this.oddsWarningIgnored = false;
                this.resetSession(false);
                this.updateCurrentBoxDisplay();
                this.closeLoadModal();
                this.showMessage('Lootbox loaded successfully!', 'success');
                
                // Ensure we're not in editing mode after loading
                if (this.isEditing) {
                    this.isEditing = false;
                    this.elements.editor.classList.add('hidden');
                    this.elements.warning.classList.add('hidden');
                    this.updateOpenButtonState();
                }
            } else {
                this.showMessage('Lootbox not found.', 'error');
            }
        } catch (error) {
            this.showMessage('Error loading lootbox: ' + error.message, 'error');
        }
    }
    
    deleteSavedLootbox(name) {
        try {
            localStorage.removeItem(`lootbox_${name}`);
            this.populateLoadModal();
            this.showMessage('Lootbox deleted successfully!', 'success');
        } catch (error) {
            this.showMessage('Error deleting lootbox: ' + error.message, 'error');
        }
    }
    
    closeLoadModal() {
        this.elements.loadModal.classList.add('hidden');
    }
    
    addToHistory(itemName) {
        const historyEntry = {
            item: itemName,
            timestamp: new Date(),
            lootboxName: this.currentLootbox.name
        };
        
        this.sessionHistory.unshift(historyEntry); // Add to beginning
        this.updateSessionDisplay();
    }
    
    updateSessionDisplay() {
        // Update history list
        this.elements.historyList.innerHTML = '';
        
        // Generate item counts for stats
        const itemCounts = {};
        this.sessionHistory.forEach(entry => {
            itemCounts[entry.item] = (itemCounts[entry.item] || 0) + 1;
        });
        
        // Always update stats section (even when empty)
        this.updateSessionStats(itemCounts);
        
        if (this.sessionHistory.length === 0) {
            this.elements.historyList.innerHTML = '<div class="no-history">No pulls yet this session</div>';
            return;
        }
        
        // Add history items
        this.sessionHistory.forEach(entry => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <span class="history-item-name">You got: ${entry.item}</span>
                <span class="history-item-time">${entry.timestamp.toLocaleTimeString()}</span>
            `;
            this.elements.historyList.appendChild(historyItem);
        });
    }
    
    updateSessionStats(itemCounts) {
        // Clear existing stats except total pulls
        this.elements.sessionStats.innerHTML = `
            <div class="stat-item">Total Pulls: <span id="totalPulls">${this.sessionHistory.length}</span></div>
        `;
        
        // Add item counts
        Object.entries(itemCounts)
            .sort(([,a], [,b]) => b - a) // Sort by count descending
            .forEach(([item, count]) => {
                const statItem = document.createElement('div');
                statItem.className = 'stat-item';
                statItem.innerHTML = `${item}: <span>${count}</span>`;
                this.elements.sessionStats.appendChild(statItem);
            });
        
        // Re-get the totalPulls element since we recreated the stats
        this.elements.totalPulls = document.getElementById('totalPulls');
    }
    
    resetSession(showMessage = true) {
        this.sessionHistory = [];
        this.updateSessionDisplay();
        if (showMessage) {
            this.showMessage('History cleared successfully!', 'success');
        }
    }
    
    clearHistory() {
        this.resetSession();
    }
    
    toggleSessionHistory() {
        const isCollapsed = this.elements.sessionContent.classList.contains('collapsed');
        
        if (isCollapsed) {
            this.elements.sessionContent.classList.remove('collapsed');
            this.elements.toggleButton.classList.remove('collapsed');
            this.elements.toggleButton.textContent = '▼';
        } else {
            this.elements.sessionContent.classList.add('collapsed');
            this.elements.toggleButton.classList.add('collapsed');
            this.elements.toggleButton.textContent = '▶';
        }
    }
}

const app = new LootboxApp();