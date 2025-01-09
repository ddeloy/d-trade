import { fetchIntradayData } from '../utils/api-mkt-chart.ts';
import { generateMarketProfileTable } from './MarketProfileTable';

export function ProfileDashboard(): HTMLElement {
    const dashboard = document.createElement('div');

    dashboard.innerHTML = `
        <h2>Market Profile Dashboard</h2>
        <div>
            <h4>Enter a valid symbol, click 'Fetch Data' to load real-time data from Alpha Vantage API (15-min delay)</h4>
            <input id="symbol-input" type="text" placeholder="Enter stock symbol" />
            <button id="fetch-button">Fetch Data</button>
        </div>
        <div>
        <p>The <a href="https://en.wikipedia.org/wiki/Market_profile" target="_blank"><em>Market Profile</em></a>, inspired by the work of Peter Steidlmayer, displays TPOs (Time Price Opportunities) for each price level during the full trading day. Each capital letter corresponds to a 30-minute interval.</p>    
        </div>
        <div id="stock-data" style="margin-top: 1rem;"></div>
        <div id="day-summary" style="margin-top: 2rem; display: none; width:fit-content">
            <h3 style="text-align:center">Day Summary</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 2rem;">
                <tr>
                    <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Open</th>
                    <td id="day-open" style="padding: 8px; border: 1px solid #ddd;"></td>
                </tr>
                <tr>
                    <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Last</th>
                    <td id="day-last" style="padding: 8px; border: 1px solid #ddd;"></td>
                </tr>
                <tr>
                    <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">High</th>
                    <td id="day-high" style="padding: 8px; border: 1px solid #ddd;"></td>
                </tr>
                <tr>
                    <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Low</th>
                    <td id="day-low" style="padding: 8px; border: 1px solid #ddd;"></td>
                </tr>
            </table>
        </div>
        <div id="market-profile-table-container" style="margin-top: 2rem;">
   
        </div>
    `;

    const input = dashboard.querySelector<HTMLInputElement>('#symbol-input')!;
    const button = dashboard.querySelector<HTMLButtonElement>('#fetch-button')!;
    const stockDataDiv = dashboard.querySelector<HTMLDivElement>('#stock-data')!;
    const daySummaryDiv = dashboard.querySelector<HTMLDivElement>('#day-summary')!;
    const dayOpen = dashboard.querySelector<HTMLTableCellElement>('#day-open')!;
    const dayLast = dashboard.querySelector<HTMLTableCellElement>('#day-last')!;
    const dayHigh = dashboard.querySelector<HTMLTableCellElement>('#day-high')!;
    const dayLow = dashboard.querySelector<HTMLTableCellElement>('#day-low')!;
    const marketProfileTableContainer = dashboard.querySelector<HTMLDivElement>('#market-profile-table-container')!;

    button.addEventListener('click', async () => {
        const symbol = input.value.trim().toUpperCase();
        if (!symbol) {
            stockDataDiv.textContent = 'Please enter a valid stock symbol.';
            return;
        }

        try {
            stockDataDiv.textContent = 'Loading...';

            const historicalData = await fetchIntradayData(symbol, '30min', 'compact');
            const priceToLetters = generateMarketProfileTable(historicalData);

            // Extract Open, Last, High, and Low values
            const timestamps = Object.keys(historicalData).sort();
            const firstEntry = historicalData[timestamps[0]];
            const lastEntry = historicalData[timestamps[timestamps.length - 1]];
            const allHighs = Object.values(historicalData).map((entry) => parseFloat(entry['2. high']));
            const allLows = Object.values(historicalData).map((entry) => parseFloat(entry['3. low']));

            dayOpen.textContent = parseFloat(firstEntry['1. open']).toFixed(2);
            dayLast.textContent = parseFloat(lastEntry['4. close']).toFixed(2);
            dayHigh.textContent = Math.max(...allHighs).toFixed(2);
            dayLow.textContent = Math.min(...allLows).toFixed(2);

            daySummaryDiv.style.display = 'block';

            // Clear existing table
            marketProfileTableContainer.innerHTML = '';

            // Create new table
            const table = document.createElement('table');
            table.style.width = '100%';
            table.style.borderCollapse = 'collapse';

            const headerRow = document.createElement('tr');
            headerRow.innerHTML = `
                <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Price</th>
                <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">TPOs (Time Price Opportunities)</th>
            `;
            table.appendChild(headerRow);

            Object.keys(priceToLetters)
                .sort((a, b) => parseFloat(b) - parseFloat(a)) // Sort descending
                .forEach((price) => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td style="padding: 8px; border: 1px solid #ddd;">${parseFloat(price).toFixed(2)}</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${priceToLetters[parseFloat(price)].join('')}</td>
                    `;
                    table.appendChild(row);
                });

            marketProfileTableContainer.appendChild(table);
            stockDataDiv.textContent = `Data for ${symbol} updated successfully.`;
        } catch (error) {
            console.error('Error fetching or rendering data:', error);
            stockDataDiv.textContent = `Error: ${error instanceof Error ? error.message : 'Unable to fetch data.'}`;
        }
    });

    return dashboard;
}