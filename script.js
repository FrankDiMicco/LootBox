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
            
            fileInput: document.getElementById('fileInput')
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
        
        this.elements.fileInput.addEventListener('change', (e) => this.handleFileLoad(e));
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
        const dataStr = JSON.stringify(this.currentLootbox, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `${this.currentLootbox.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
        link.click();
    }
    
    loadLootbox() {
        this.elements.fileInput.click();
    }
    
    handleFileLoad(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const lootbox = JSON.parse(e.target.result);
                
                if (lootbox.name && lootbox.items && Array.isArray(lootbox.items)) {
                    this.currentLootbox = {
                        ...lootbox,
                        revealContents: lootbox.revealContents !== false,
                        revealOdds: lootbox.revealOdds !== false
                    };
                    this.oddsWarningIgnored = false;
                    this.updateCurrentBoxDisplay();
                    this.showMessage('Lootbox loaded successfully!', 'success');
                } else {
                    this.showMessage('Invalid lootbox file format.', 'error');
                }
            } catch (error) {
                this.showMessage('Error reading file: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
        
        event.target.value = '';
    }
}

const app = new LootboxApp();