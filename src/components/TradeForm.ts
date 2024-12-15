export type Trade = {
    symbol: string;
    action: string;
    quantity: number;
    price: number;
};

export function TradeForm(onTradePlanned: (trade: Trade) => void): HTMLElement {
    const formContainer = document.createElement('div');

    formContainer.innerHTML = `
        <form id="trade-form">
            <div>
                <label for="symbol">Stock Symbol:</label>
                <input id="symbol" type="text" placeholder="e.g., AAPL" required />
            </div>
            <div>
                <label for="action">Action:</label>
                <select id="action" required>
                    <option value="buy">Buy</option>
                    <option value="sell">Sell</option>
                </select>
            </div>
            <div>
                <label for="quantity">Quantity:</label>
                <input id="quantity" type="number" min="1" placeholder="Enter quantity" required />
            </div>
            <div>
                <label for="price">Price (per unit):</label>
                <input id="price" type="number" step="0.01" placeholder="Enter price" required />
            </div>
            <button type="submit">Plan Trade</button>
        </form>
    `;

    const form = formContainer.querySelector<HTMLFormElement>('#trade-form')!;

    function validateTradeInput(symbol: string, action: string, quantity: number, price: number): string | null {
        if (!symbol.match(/^[A-Za-z]+$/)) return 'Invalid stock symbol.';
        if (!['buy', 'sell'].includes(action)) return 'Invalid action. Choose Buy or Sell.';
        if (quantity <= 0) return 'Quantity must be greater than 0.';
        if (price <= 0) return 'Price must be greater than 0.';
        return null; // Validation passed
    }

// Inside the TradeForm submission logic
    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const symbol = (form.querySelector<HTMLInputElement>('#symbol')!).value.trim().toUpperCase();
        const action = (form.querySelector<HTMLSelectElement>('#action')!).value;
        const quantity = parseInt((form.querySelector<HTMLInputElement>('#quantity')!).value, 10);
        const price = parseFloat((form.querySelector<HTMLInputElement>('#price')!).value);

        const error = validateTradeInput(symbol, action, quantity, price);
        if (error) {
            alert(error); // Replace with better UI feedback later
            return;
        }

        onTradePlanned({ symbol, action, quantity, price });
        form.reset();
    });


    return formContainer;
}
