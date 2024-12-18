import { TradeForm } from './TradeForm';

type Trade = {
    symbol: string;
    action: string;
    quantity: number;
    price: number;
    strategy?: string;
    notes?: string;
    executedPrice?: number;
    status?: 'pending' | 'executed';
    profitLoss?: number;
};

type OpenTrade = {
    quantity: number;
    executedPrice: number;
};

// Tracks open buy trades
const openTrades: { [symbol: string]: OpenTrade[] } = {};

const strategies = ['A Up', 'A Down', 'Rubber Band', 'Fade', 'System Failure', 'Scalp','Overnight'];

export function Trades(): HTMLElement {
    const plannedTrades: Trade[] = loadTradesFromLocalStorage();
    const tradesPage = document.createElement('div');

    tradesPage.innerHTML = `
        <div id="notification-container"></div>
        <h2>Trades</h2>
        <div id="trade-form-container"></div>
        <h3>Planned Trades</h3>
        <table id="planned-trades">
            <thead>
                <tr>
                    <th>Symbol</th>
                    <th>Strategy</th>
                    <th>Notes</th>
                    <th>Action</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total</th>
                    <th>Profit/Loss</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
        <h3>Summary</h3>
        <div id="trade-summary">
            <p><strong>Total Buy:</strong> $0.00</p>
            <p><strong>Total Sell:</strong> $0.00</p>
            <p><strong>Overall Profit/Loss:</strong> $0.00</p>
        </div>
    `;

    const plannedTradesTable = tradesPage.querySelector<HTMLTableSectionElement>('#planned-trades tbody')!;
    const summaryDiv = tradesPage.querySelector<HTMLDivElement>('#trade-summary')!;
    const notificationContainer = tradesPage.querySelector<HTMLDivElement>('#notification-container')!;

    function showNotification(message: string, type: 'success' | 'error'): void {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        notificationContainer.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    function saveTradesToLocalStorage(): void {
        localStorage.setItem('plannedTrades', JSON.stringify(plannedTrades));
    }

    function loadTradesFromLocalStorage(): Trade[] {
        const storedTrades = localStorage.getItem('plannedTrades');
        return storedTrades ? JSON.parse(storedTrades) : [];
    }

    function calculateTradeProfitLoss(symbol: string, sellQuantity: number, sellPrice: number): number {
        let profit = 0;

        if (openTrades[symbol]) {
            const buys = openTrades[symbol];
            let remainingSellQuantity = sellQuantity;

            while (remainingSellQuantity > 0 && buys.length > 0) {
                const buy = buys[0];
                const matchedQuantity = Math.min(remainingSellQuantity, buy.quantity);

                profit += matchedQuantity * (sellPrice - buy.executedPrice);
                buy.quantity -= matchedQuantity;
                remainingSellQuantity -= matchedQuantity;

                if (buy.quantity === 0) buys.shift();
            }
        }

        return profit;
    }

    function updatePlannedTradesTable(): void {
        plannedTradesTable.innerHTML = plannedTrades.length
            ? plannedTrades.map((trade, index) => `
                <tr>
                    <td>${trade.symbol}</td>
                    <td>
                        <select class="strategy-select" data-index="${index}">
                            <option value="">Select Strategy</option>
                            ${strategies.map(
                (s) => `<option value="${s}" ${trade.strategy === s ? 'selected' : ''}>${s}</option>`
            ).join('')}
                        </select>
                    </td>
                    <td contenteditable="true" class="notes-cell" data-index="${index}">
                        ${trade.notes || '<span class="placeholder">Click to add notes</span>'}
                    </td>
                    <td>${trade.action}</td>
                    <td>${trade.quantity}</td>
                    <td>$${trade.price.toFixed(2)}</td>
                    <td>$${(trade.quantity * trade.price).toFixed(2)}</td>
                    <td>${trade.profitLoss !== undefined ? `$${trade.profitLoss.toFixed(2)}` : '-'}</td>
                    <td>
                        <button class="execute-trade" data-index="${index}">Execute</button>
                        <button class="delete-trade" data-index="${index}">Delete</button>
                    </td>
                </tr>
            `).join('')
            : '<tr><td colspan="9">No trades planned yet.</td></tr>';

        saveTradesToLocalStorage();
        updateSummary();

        tradesPage.querySelectorAll<HTMLSelectElement>('.strategy-select').forEach((select) => {
            select.addEventListener('change', () => {
                const index = parseInt(select.dataset.index!);
                plannedTrades[index].strategy = select.value;
                saveTradesToLocalStorage();
            });
        });

        tradesPage.querySelectorAll<HTMLTableCellElement>('.notes-cell').forEach((cell) => {
            const index = parseInt(cell.dataset.index!);
            const trade = plannedTrades[index];

            cell.addEventListener('focus', () => {
                if (!trade.notes) {
                    cell.classList.remove('placeholder');
                    cell.textContent = '';
                }
            });

            cell.addEventListener('blur', () => {
                const text = cell.textContent?.trim();
                if (text) {
                    trade.notes = text;
                    cell.classList.remove('placeholder');
                } else {
                    trade.notes = '';
                    cell.innerHTML = '<span class="placeholder">Click to add notes</span>';
                }
                saveTradesToLocalStorage();
            });
        });

        tradesPage.querySelectorAll<HTMLButtonElement>('.execute-trade').forEach((btn) => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index!);
                const trade = plannedTrades[index];
                trade.status = 'executed';

                if (trade.action === 'buy') {
                    if (!openTrades[trade.symbol]) openTrades[trade.symbol] = [];
                    openTrades[trade.symbol].push({ quantity: trade.quantity, executedPrice: trade.price });
                } else if (trade.action === 'sell') {
                    trade.profitLoss = calculateTradeProfitLoss(trade.symbol, trade.quantity, trade.price);
                }

                updatePlannedTradesTable();
                showNotification('Trade executed successfully!', 'success');
            });
        });

        tradesPage.querySelectorAll<HTMLButtonElement>('.delete-trade').forEach((btn) => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index!);
                plannedTrades.splice(index, 1);
                updatePlannedTradesTable();
            });
        });
    }

    function updateSummary(): void {
        const totals = plannedTrades.reduce(
            (acc, trade) => {
                const value = trade.quantity * trade.price;
                if (trade.action === 'buy') acc.totalBuy += value;
                else if (trade.action === 'sell') acc.totalSell += value;

                acc.totalProfitLoss += trade.profitLoss || 0;
                return acc;
            },
            { totalBuy: 0, totalSell: 0, totalProfitLoss: 0 }
        );

        summaryDiv.innerHTML = `
            <p><strong>Total Buy:</strong> $${totals.totalBuy.toFixed(2)}</p>
            <p><strong>Total Sell:</strong> $${totals.totalSell.toFixed(2)}</p>
            <p><strong>Overall Profit/Loss:</strong> $${totals.totalProfitLoss.toFixed(2)}</p>
        `;
    }

    const tradeForm = TradeForm((trade) => {
        plannedTrades.push(trade);
        updatePlannedTradesTable();
    });

    tradesPage.querySelector('#trade-form-container')!.appendChild(tradeForm);
    updatePlannedTradesTable();

    return tradesPage;
}
