class HappyChairGame {
    constructor() {
        this.currentTurn = 1;
        this.score = 0;
        this.gameOver = false;
        
        this.waitingQueue = [];
        
        // デッキシステム
        this.calmDeck = [];
        this.rushDeck = [];
        this.currentDeck = null;
        this.isRushPhase = false;
        this.deckPosition = 0;
        
        this.counterSeat = {
            capacity: 6,
            customers: []
        };
        
        this.tableSeat4A = { capacity: 4, customer: null };
        this.tableSeat4B = { capacity: 4, customer: null };
        this.tableSeat4C = { capacity: 4, customer: null };
        this.tableSeat4D = { capacity: 4, customer: null };
        this.tableSeat2A = { capacity: 2, customer: null };
        this.tableSeat2B = { capacity: 2, customer: null };
        this.tableSeat2C = { capacity: 2, customer: null };
        
        this.init();
    }
    
    init() {
        this.generateInitialQueue();
        this.updateDisplay();
        this.bindEvents();
    }
    
    generateInitialQueue() {
        this.initializeDecks();
        
        for (let i = 0; i < 2; i++) {
            const customerCount = this.drawFromDeck();
            this.waitingQueue.push(customerCount);
        }
    }
    
    initializeDecks() {
        // 平穏デッキ: {1人客: 4, 2人客: 5, 3人客: 1} (計10枚) - 2人客重視版
        this.calmDeck = [
            1, 1, 1, 1,     // 1人客 x4 (カウンター席調整用)
            2, 2, 2, 2, 2,  // 2人客 x5 (2人席フル活用)  
            3               // 3人客 x1 (軽いプレッシャー)
        ];
        
        // ラッシュデッキ: {2人客: 3, 3人客: 2, 4人客: 3} (計8枚) - 4人客重視版
        this.rushDeck = [
            2, 2, 2,        // 2人客 x3 (柔軟性アップ)
            3, 3,           // 3人客 x2 (プレッシャー軽減)
            4, 4, 4         // 4人客 x3 (ボス客メイン！)
        ];
        
        // シャッフル
        this.shuffleDeck(this.calmDeck);
        this.shuffleDeck(this.rushDeck);
        
        // 平穏からスタート
        this.currentDeck = this.calmDeck;
        this.isRushPhase = false;
        this.deckPosition = 0;
    }
    
    shuffleDeck(deck) {
        // 通常のシャッフル
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        
        // 1人客の3連続制限を適用
        this.fix3ConsecutiveSingles(deck);
    }
    
    fix3ConsecutiveSingles(deck) {
        for (let i = 0; i < deck.length - 2; i++) {
            // 3連続1人客を発見
            if (deck[i] === 1 && deck[i + 1] === 1 && deck[i + 2] === 1) {
                // 3番目の1人客を他の位置の非1人客と交換
                for (let j = i + 3; j < deck.length; j++) {
                    if (deck[j] !== 1) {
                        [deck[i + 2], deck[j]] = [deck[j], deck[i + 2]];
                        break;
                    }
                }
                
                // 交換先が見つからない場合は2番目と交換
                if (deck[i + 2] === 1) {
                    for (let j = 0; j < i; j++) {
                        if (deck[j] !== 1) {
                            [deck[i + 1], deck[j]] = [deck[j], deck[i + 1]];
                            break;
                        }
                    }
                }
            }
        }
    }
    
    drawFromDeck() {
        if (this.deckPosition >= this.currentDeck.length) {
            // デックを使い切ったら交代
            this.switchDeck();
        }
        
        const customerCount = this.currentDeck[this.deckPosition];
        this.deckPosition++;
        return customerCount;
    }
    
    switchDeck() {
        this.isRushPhase = !this.isRushPhase;
        
        if (this.isRushPhase) {
            // ラッシュフェーズに切り替え
            this.shuffleDeck(this.rushDeck);
            this.currentDeck = this.rushDeck;
        } else {
            // 平穏フェーズに切り替え
            this.shuffleDeck(this.calmDeck);
            this.currentDeck = this.calmDeck;
        }
        
        this.deckPosition = 0;
    }
    
    updateWaveInfo() {
        const currentWaveElement = document.getElementById('current-wave');
        const waveProgressElement = document.getElementById('wave-progress');
        
        // 現在のフェーズ表示
        if (this.isRushPhase) {
            currentWaveElement.textContent = 'ラッシュフェーズ';
            currentWaveElement.className = 'current-wave rush';
        } else {
            currentWaveElement.textContent = '平穏フェーズ';
            currentWaveElement.className = 'current-wave calm';
        }
        
        // 残りカード数表示
        const remainingCards = this.currentDeck.length - this.deckPosition;
        waveProgressElement.textContent = `残り: ${remainingCards}枚`;
        
        // 残り少なくなったら警告
        if (remainingCards <= 2) {
            if (this.isRushPhase) {
                waveProgressElement.textContent += ' (平穏が近づいています)';
                waveProgressElement.style.background = 'rgba(135, 206, 235, 0.3)';
            } else {
                waveProgressElement.textContent += ' (ラッシュが近づいています!)';
                waveProgressElement.style.background = 'rgba(255, 107, 71, 0.3)';
            }
        } else {
            waveProgressElement.style.background = 'rgba(255, 255, 255, 0.8)';
        }
    }
    
    bindEvents() {
        document.getElementById('new-game').addEventListener('click', () => this.newGame());
        document.getElementById('restart-game').addEventListener('click', () => this.newGame());
        
        this.setupClickEvents();
    }
    
    setupClickEvents() {
        document.querySelectorAll('.drop-zone').forEach(zone => {
            zone.addEventListener('click', (e) => this.handleSeatClick(e));
        });
    }
    
    handleSeatClick(e) {
        if (this.gameOver || this.waitingQueue.length === 0) return;
        
        const seatElement = e.target.closest('.drop-zone');
        if (!seatElement) return;
        
        const frontCustomer = this.waitingQueue[0];
        
        if (this.canAssignToSeat(seatElement, frontCustomer)) {
            this.assignCustomerToSeat(seatElement, frontCustomer);
        }
    }
    
    canAssignToSeat(seatElement, customerCount) {
        const seatType = seatElement.dataset.seatType;
        
        if (seatType === 'counter') {
            const currentOccupancy = this.counterSeat.customers.reduce((sum, c) => sum + c.count, 0);
            return currentOccupancy + customerCount <= this.counterSeat.capacity;
        } else if (seatType === 'table') {
            const capacity = parseInt(seatElement.dataset.capacity);
            const table = this.getTableBySeatId(seatElement.id);
            return table && table.customer === null && customerCount <= capacity;
        }
        
        return false;
    }
    
    assignCustomerToSeat(seatElement, customerCount) {
        const seatType = seatElement.dataset.seatType;
        
        if (seatType === 'counter') {
            this.counterSeat.customers.push({
                count: customerCount,
                remainingTurns: 7,
                isNewlySeated: true  // 新しく着席したフラグ
            });
        } else if (seatType === 'table') {
            const table = this.getTableBySeatId(seatElement.id);
            if (table) {
                table.customer = {
                    count: customerCount,
                    remainingTurns: 7,
                    isNewlySeated: true  // 新しく着席したフラグ
                };
            }
        }
        
        this.waitingQueue.shift(); // 先頭のお客さんを削除
        this.updateDisplay();
        
        setTimeout(() => this.processNextTurn(), 300);
    }
    
    getTableBySeatId(seatId) {
        switch(seatId) {
            case 'table-4-1': return this.tableSeat4A;
            case 'table-4-2': return this.tableSeat4B;
            case 'table-4-3': return this.tableSeat4C;
            case 'table-4-4': return this.tableSeat4D;
            case 'table-2-1': return this.tableSeat2A;
            case 'table-2-2': return this.tableSeat2B;
            case 'table-2-3': return this.tableSeat2C;
            default: return null;
        }
    }
    
    processNextTurn() {
        if (this.gameOver) return;
        
        this.processCustomerDepartures();
        this.addNewCustomer();
        this.checkGameOver();
        
        if (!this.gameOver) {
            this.currentTurn++;
            this.score = this.currentTurn - 1;
            this.updateDisplay();
        }
    }
    
    processCustomerDepartures() {
        this.counterSeat.customers = this.counterSeat.customers.filter(customer => {
            // 新しく着席したお客さんはターン消費しない
            if (customer.isNewlySeated) {
                customer.isNewlySeated = false;
                return true;
            }
            customer.remainingTurns--;
            return customer.remainingTurns > 0;
        });
        
        [this.tableSeat4A, this.tableSeat4B, this.tableSeat4C, this.tableSeat4D, this.tableSeat2A, this.tableSeat2B, this.tableSeat2C].forEach(table => {
            if (table.customer) {
                // 新しく着席したお客さんはターン消費しない
                if (table.customer.isNewlySeated) {
                    table.customer.isNewlySeated = false;
                    return;
                }
                table.customer.remainingTurns--;
                if (table.customer.remainingTurns <= 0) {
                    table.customer = null;
                }
            }
        });
    }
    
    addNewCustomer() {
        const newCustomer = this.drawFromDeck();
        this.waitingQueue.push(newCustomer);
    }
    
    checkGameOver() {
        if (this.waitingQueue.length === 0) return;
        
        // 先頭のお客さんのみチェック（列の順序ルール）
        const frontCustomerCount = this.waitingQueue[0];
        if (!this.canAssignCustomerAnywhere(frontCustomerCount)) {
            this.gameOver = true;
            this.showGameOver();
        }
    }
    
    canAssignCustomerAnywhere(customerCount) {
        // カウンター席に案内できるか
        const counterOccupancy = this.counterSeat.customers.reduce((sum, c) => sum + c.count, 0);
        if (counterOccupancy + customerCount <= this.counterSeat.capacity) {
            return true;
        }
        
        // テーブル席に案内できるか
        const tables = [this.tableSeat4A, this.tableSeat4B, this.tableSeat4C, this.tableSeat4D, this.tableSeat2A, this.tableSeat2B, this.tableSeat2C];
        for (const table of tables) {
            if (table.customer === null && customerCount <= table.capacity) {
                return true;
            }
        }
        
        return false;
    }
    
    showGameOver() {
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('game-over').style.display = 'flex';
    }
    
    newGame() {
        this.currentTurn = 1;
        this.score = 0;
        this.gameOver = false;
        this.waitingQueue = [];
        
        this.counterSeat.customers = [];
        this.tableSeat4A.customer = null;
        this.tableSeat4B.customer = null;
        this.tableSeat4C.customer = null;
        this.tableSeat4D.customer = null;
        this.tableSeat2A.customer = null;
        this.tableSeat2B.customer = null;
        this.tableSeat2C.customer = null;
        
        document.getElementById('game-over').style.display = 'none';
        this.generateInitialQueue();
        this.updateDisplay();
    }
    
    updateDisplay() {
        document.getElementById('turn-count').textContent = this.currentTurn;
        document.getElementById('score').textContent = this.score;
        
        this.updateWaitingQueue();
        this.updateSeats();
        this.updateWaveInfo();
    }
    
    updateWaitingQueue() {
        const queueSlots = document.querySelectorAll('.queue-slot');
        queueSlots.forEach((slot, index) => {
            slot.classList.remove('has-customer', 'not-draggable');
            slot.innerHTML = '';
            
            if (index < this.waitingQueue.length) {
                const customerCount = this.waitingQueue[index];
                slot.classList.add('has-customer');
                
                // 先頭のお客さんのみ明るく表示
                if (index === 0) {
                    slot.classList.add('can-assign');
                } else {
                    slot.classList.add('not-draggable');
                }
                
                const iconsDiv = document.createElement('div');
                iconsDiv.className = 'customer-icons';
                
                for (let i = 0; i < customerCount; i++) {
                    const icon = document.createElement('div');
                    icon.className = 'customer-icon';
                    iconsDiv.appendChild(icon);
                }
                
                const label = document.createElement('div');
                label.textContent = `${customerCount}人`;
                
                slot.appendChild(iconsDiv);
                slot.appendChild(label);
            } else {
                slot.textContent = '空';
            }
        });
    }
    
    
    updateSeats() {
        this.updateCounterSeat();
        this.updateTableSeat('table-4-1', this.tableSeat4A, '4人席A');
        this.updateTableSeat('table-4-2', this.tableSeat4B, '4人席B');
        this.updateTableSeat('table-4-3', this.tableSeat4C, '4人席C');
        this.updateTableSeat('table-4-4', this.tableSeat4D, '4人席D');
        this.updateTableSeat('table-2-1', this.tableSeat2A, '2人席A');
        this.updateTableSeat('table-2-2', this.tableSeat2B, '2人席B');
        this.updateTableSeat('table-2-3', this.tableSeat2C, '2人席C');
    }
    
    updateCounterSeat() {
        const counterSeat = document.getElementById('counter-seat');
        const currentOccupancy = this.counterSeat.customers.reduce((sum, c) => sum + c.count, 0);
        
        counterSeat.innerHTML = '';
        
        if (currentOccupancy > 0) {
            const iconsDiv = document.createElement('div');
            iconsDiv.className = 'seat-icons';
            
            // カウンター席の各グループのアイコンを追加
            for (const group of this.counterSeat.customers) {
                for (let i = 0; i < group.count; i++) {
                    const icon = document.createElement('div');
                    icon.className = `seat-customer-icon turns-${group.remainingTurns}`;
                    iconsDiv.appendChild(icon);
                }
            }
            
            counterSeat.appendChild(iconsDiv);
        }
        
        const capacityDiv = document.createElement('div');
        capacityDiv.className = 'seat-capacity';
        capacityDiv.textContent = `${currentOccupancy}/${this.counterSeat.capacity}人`;
        counterSeat.appendChild(capacityDiv);
        
        counterSeat.classList.remove('occupied');
        if (currentOccupancy > 0) {
            counterSeat.classList.add('occupied');
        }
    }
    
    updateTableSeat(elementId, table, label) {
        const seatElement = document.getElementById(elementId);
        const labelElement = seatElement.querySelector('.table-label');
        labelElement.textContent = label;
        
        const statusElement = seatElement.querySelector('.seat-status');
        
        seatElement.classList.remove('occupied');
        
        const existingIcons = seatElement.querySelector('.seat-icons');
        if (existingIcons) {
            existingIcons.remove();
        }
        
        if (table.customer) {
            const iconsDiv = document.createElement('div');
            iconsDiv.className = 'seat-icons';
            
            for (let i = 0; i < table.customer.count; i++) {
                const icon = document.createElement('div');
                icon.className = `seat-customer-icon turns-${table.customer.remainingTurns}`;
                iconsDiv.appendChild(icon);
            }
            
            seatElement.insertBefore(iconsDiv, statusElement);
            statusElement.textContent = `${table.customer.count}人 (残り${table.customer.remainingTurns}ターン)`;
            seatElement.classList.add('occupied');
        } else {
            statusElement.textContent = '空席';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new HappyChairGame();
});