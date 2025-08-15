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
            revealOdds: true
        };
        
        this.isEditing = false;
        this.oddsWarningIgnored = false;
        
        this.initializeElements();
        this.attachEventListeners();
        this.updateCurrentBoxDisplay();
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
            addItem: document.getElementById('addItem'),
            itemsList: document.getElementById('itemsList'),
            totalOdds: document.getElementById('totalOdds'),
            saveChanges: document.getElementById('saveChanges'),
            cancelEdit: document.getElementById('cancelEdit'),
            
            currentBox: document.getElementById('currentBox'),
            currentBoxName: document.getElementById('currentBoxName'),
            currentItems: document.getElementById('currentItems'),
            
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
        
        this.elements.proceedAnyway.addEventListener('click', () => this.proceedWithWarning());
        
        this.elements.addItem.addEventListener('click', () => this.addItemRow());
        this.elements.saveChanges.addEventListener('click', () => this.saveChanges());
        this.elements.cancelEdit.addEventListener('click', () => this.cancelEdit());
        
        this.elements.revealContents.addEventListener('change', () => this.updateCurrentBoxDisplay());
        this.elements.revealOdds.addEventListener('change', () => this.updateCurrentBoxDisplay());
        
        this.elements.closeModal.addEventListener('click', () => this.closeLoadModal());
        this.elements.loadModal.addEventListener('click', (e) => {
            if (e.target === this.elements.loadModal) {
                this.closeLoadModal();
            }
        });
    }
    
    openLootbox() {
        if (!this.validateOdds() && !this.oddsWarningIgnored) {
            this.showWarning();
            return;
        }
        
        const result = this.rollLootbox();
        this.displayResult(result);
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
        setTimeout(() => {
            this.elements.result.classList.add('hidden');
        }, 3000);
    }
    
    editLootbox() {
        this.isEditing = true;
        this.oddsWarningIgnored = false;
        this.elements.boxName.value = this.currentLootbox.name;
        this.elements.revealContents.checked = this.currentLootbox.revealContents !== false;
        this.elements.revealOdds.checked = this.currentLootbox.revealOdds !== false;
        this.populateItemsList();
        this.elements.editor.classList.remove('hidden');
        this.updateTotalOdds();
    }
    
    createNewLootbox() {
        this.currentLootbox = {
            name: 'New Lootbox',
            items: [
                { name: 'Default Item', odds: 1.0 }
            ],
            revealContents: true,
            revealOdds: true
        };
        this.oddsWarningIgnored = false;
        this.updateCurrentBoxDisplay();
        this.editLootbox();
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
        
        this.isEditing = false;
        this.oddsWarningIgnored = false;
        this.elements.editor.classList.add('hidden');
        this.elements.warning.classList.add('hidden');
        this.updateCurrentBoxDisplay();
        this.showMessage('Lootbox saved successfully!', 'success');
    }
    
    cancelEdit() {
        this.isEditing = false;
        this.oddsWarningIgnored = false;
        this.elements.editor.classList.add('hidden');
        this.elements.warning.classList.add('hidden');
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
    
    saveLootbox() {
        const lootboxData = {
            ...this.currentLootbox,
            lastUpdated: new Date().toISOString()
        };
        
        try {
            localStorage.setItem(`lootbox_${this.currentLootbox.name}`, JSON.stringify(lootboxData));
            this.showMessage('Lootbox saved successfully!', 'success');
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
                    revealOdds: lootbox.revealOdds !== false
                };
                this.oddsWarningIgnored = false;
                this.updateCurrentBoxDisplay();
                this.closeLoadModal();
                this.showMessage('Lootbox loaded successfully!', 'success');
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
}

const app = new LootboxApp();