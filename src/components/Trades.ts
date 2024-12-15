import { TradeForm } from './TradeForm';

type Trade = {
    symbol: string;
    action: string; // 'buy' or 'sell'
    quantity: number;
    price: number; // Planned price
    executedPrice?: number; // Actual price when executed
    status?: 'pending' | 'executed'; // Status of the trade
    profitLoss?: number; // P/L for executed trades
};

// Tracks unmatched buy trades for each symbol
const openTrades: { [symbol: string]: { quantity: number; executedPrice: number }[] } = {};

export function Trades(): HTMLElement {
    const plannedTrades: Trade[] = loadTradesFromLocalStorage(); // Load saved trades
    const tradesPage = document.createElement('div');

    // HTML structure for the trades page
    tradesPage.innerHTML = `
        <div id="notification-container"></div> <!-- Notification container -->
        <h2>Trades</h2>
        <div id="trade-form-container"></div>
        <h3>Planned Trades</h3>
        <table id="planned-trades">
            <thead>
                <tr>
                    <th>Symbol</th>
                    <th>Action</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total</th>
                    <th>Profit/Loss</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr><td colspan="7">No trades planned yet.</td></tr>
            </tbody>
        </table>
        <h3>Summary</h3>
        <div id="trade-summary">
            <p><strong>Total Buy:</strong> $0.00</p>
            <p><strong>Total Sell:</strong> $0.00</p>
            <p><strong>Overall Profit/Loss:</strong> $0.00</p>
        </div>
    `;

    const tradeFormContainer = tradesPage.querySelector<HTMLDivElement>('#trade-form-container')!;
    const plannedTradesTable = tradesPage.querySelector<HTMLTableSectionElement>('#planned-trades tbody')!;
    const summaryDiv = tradesPage.querySelector<HTMLDivElement>('#trade-summary')!;

    function showNotification(message: string, type: 'success' | 'error'): void {
        const container = tradesPage.querySelector<HTMLDivElement>('#notification-container')!;
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        container.appendChild(notification);
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    function saveTradesToLocalStorage(trades: Trade[]): void {
        localStorage.setItem('plannedTrades', JSON.stringify(trades));
    }

    function loadTradesFromLocalStorage(): Trade[] {
        const storedTrades = localStorage.getItem('plannedTrades');
        return storedTrades ? JSON.parse(storedTrades) : [];
    }

    async function executeTrade(trade: Trade): Promise<string> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(`Trade executed: ${trade.action} ${trade.quantity} of ${trade.symbol} at $${trade.price}`);
            }, 1000);
        });
    }

    function calculateTradeProfitLoss(symbol: string, sellQuantity: number, sellPrice: number): { profit: number; remainingSellQuantity: number } {
        let profit = 0;
        let remainingSellQuantity = sellQuantity;

        if (openTrades[symbol]) {
            const buys = openTrades[symbol];
            while (remainingSellQuantity > 0 && buys.length > 0) {
                const buy = buys[0];
                const matchedQuantity = Math.min(remainingSellQuantity, buy.quantity);

                profit += matchedQuantity * (sellPrice - buy.executedPrice);

                buy.quantity -= matchedQuantity;
                remainingSellQuantity -= matchedQuantity;

                if (buy.quantity === 0) {
                    buys.shift();
                }
            }
        }

        return { profit, remainingSellQuantity };
    }

    function calculateSummary(trades: Trade[]): { totalBuy: number; totalSell: number; totalProfitLoss: number } {
        return trades.reduce(
            (summary, trade) => {
                const tradeValue = trade.quantity * (trade.executedPrice || trade.price);
                if (trade.action === 'buy') summary.totalBuy += tradeValue;
                else if (trade.action === 'sell') summary.totalSell += tradeValue;

                if (trade.status === 'executed' && trade.action === 'sell') {
                    summary.totalProfitLoss += trade.profitLoss || 0;
                }

                return summary;
            },
            { totalBuy: 0, totalSell: 0, totalProfitLoss: 0 }
        );
    }

    function updateSummary(): void {
        const summary = calculateSummary(plannedTrades);
        summaryDiv.innerHTML = `
            <p><strong>Total Buy:</strong> $${summary.totalBuy.toFixed(2)}</p>
            <p><strong>Total Sell:</strong> $${summary.totalSell.toFixed(2)}</p>
            <p><strong>Overall Profit/Loss:</strong> $${summary.totalProfitLoss.toFixed(2)}</p>
        `;
    }

    function updatePlannedTradesTable(): void {
        plannedTradesTable.innerHTML = plannedTrades.length
            ? plannedTrades
                .map(
                    (trade, index) => `
                <tr>
                    <td>${trade.symbol}</td>
                    <td>${trade.action}</td>
                    <td>${trade.quantity}</td>
                    <td>$${trade.price.toFixed(2)}</td>
                    <td>$${(trade.quantity * trade.price).toFixed(2)}</td>
                    <td>${trade.status === 'executed' && trade.action === 'sell' ? `$${(trade.profitLoss || 0).toFixed(2)}` : '-'}</td>
                    <td>
                        <button class="delete-trade" data-index="${index}">Delete</button>
                        <button class="execute-trade" data-index="${index}" ${trade.status === 'executed' ? 'disabled' : ''}>Execute</button>
                    </td>
                </tr>
            `
                )
                .join('')
            : '<tr><td colspan="7">No trades planned yet.</td></tr>';

        saveTradesToLocalStorage(plannedTrades);
        updateSummary();

        tradesPage.querySelectorAll<HTMLButtonElement>('.delete-trade').forEach((button) => {
            button.addEventListener('click', () => {
                const index = parseInt(button.dataset.index!, 10);
                plannedTrades.splice(index, 1);
                updatePlannedTradesTable();
            });
        });

        tradesPage.querySelectorAll<HTMLButtonElement>('.execute-trade').forEach((button) => {
            button.addEventListener('click', async () => {
                const index = parseInt(button.dataset.index!, 10);
                const trade = plannedTrades[index];

                try {
                    const result = await executeTrade(trade);
                    trade.status = 'executed';
                    trade.executedPrice = trade.price;

                    if (trade.action === 'sell') {
                        const { profit } = calculateTradeProfitLoss(trade.symbol, trade.quantity, trade.executedPrice!);
                        trade.profitLoss = profit;
                    }

                    updatePlannedTradesTable();
                    showNotification(result, 'success');
                } catch (error) {
                    if (error instanceof Error) {
                        showNotification(`Error executing trade: ${error.message}`, 'error');
                    } else {
                        showNotification('An unknown error occurred.', 'error');
                    }
                }
            });
        });
    }

    const tradeForm = TradeForm((trade: Trade) => {
        plannedTrades.push(trade);
        updatePlannedTradesTable();
    });

    tradeFormContainer.appendChild(tradeForm);
    updatePlannedTradesTable();

    return tradesPage;
}
