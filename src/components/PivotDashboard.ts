import { fetchLast5DaysData } from '../utils/api';
import { Chart } from 'chart.js/auto';

export function PivotDashboard(): HTMLElement {
    const dashboard = document.createElement('div');

    dashboard.innerHTML = `
    <h2>Pivot Trading Dashboard</h2>
    <div>
        <h4>Enter a valid symbol, number of days, and click 'Fetch Data' to load real-time data from Alpha Vantage API (15-min delay)</h4>
        <input id="symbol-input" type="text" placeholder="Enter stock symbol" />
        <input id="days-input" type="number" min="1" max="30" value="5" placeholder="Days" style="width: 80px;" />
        <button id="fetch-button">Fetch Data</button>
        <button id="reset-button" style="margin-left: 8px;">Reset</button>
    </div>
    <div><h3>[WIP] Pivot Day Trading</h3>
    <p>Based on the work of Mark Fisher and his proprietary "ACD Trading Method" - combined with Peter Steidlmayer's Market Profile theory.<br/>
    The primary tenant - identifying significant points of day trade entry and exit by analyzing price action, volume, and volatility.</p>
    </div>
    <div id="stock-data" style="margin-top: 1rem;"></div>
    <div id="rolling-pivot-data" style="margin-top: 1rem; text-align: left;"></div>
    <div id="daily-table-container" style="margin-top: 2rem;">
        <h3 style="text-align:left">Data for Rolling Last 5 Trading Days</h3>
    </div>
    <div style="margin-top: 2rem; text-align: left;">
        <canvas id="pivot-chart" width="800" height="400" style="display: block; margin: 0 auto; box-sizing: border-box; max-width: 100%; max-height: 100%; height: 500px;"></canvas>
    </div>
    `;

    const input = dashboard.querySelector<HTMLInputElement>('#symbol-input')!;
    const daysInput = dashboard.querySelector<HTMLInputElement>('#days-input')!;
    const fetchButton = dashboard.querySelector<HTMLButtonElement>('#fetch-button')!;
    const resetButton = dashboard.querySelector<HTMLButtonElement>('#reset-button')!;
    const stockDataDiv = dashboard.querySelector<HTMLDivElement>('#stock-data')!;
    const rollingPivotDiv = dashboard.querySelector<HTMLDivElement>('#rolling-pivot-data')!;
    const dailyTableContainer = dashboard.querySelector<HTMLDivElement>('#daily-table-container')!;
    const pivotChartCanvas = dashboard.querySelector<HTMLCanvasElement>('#pivot-chart')!;
    let chartInstance: Chart | null = null;

    // Fetch button event listener
    fetchButton.addEventListener('click', async () => {
        const symbol = input.value.trim().toUpperCase();
        const numDays = parseInt(daysInput.value.trim(), 10) || 5; // Default to 5 days

        if (!symbol) {
            stockDataDiv.textContent = 'Please enter a valid stock symbol.';
            return;
        }

        try {
            stockDataDiv.textContent = 'Loading...';

            const { last5Days, rolling2DayPivot } = await fetchLast5DaysData(symbol, numDays);

            // Calculate running sum of Plus/Minus
            let runningSum = 0;

            // Display rolling 2-day pivot data
            rollingPivotDiv.innerHTML = `
                <strong>Rolling 2-Day Pivot Diff:</strong> ${rolling2DayPivot.rollingPivotDiff} | 
                <strong>Rolling Pivot Range:</strong> ${rolling2DayPivot.rollingPivotRange} | 
                <strong>Running Plus/Minus:</strong> <span id="running-sum"></span>
            `;

            // Clear existing table
            dailyTableContainer.innerHTML = '';

            // Create new table
            const table = document.createElement('table');
            table.style.width = 'fit-content';
            table.style.borderCollapse = 'collapse';

            // Create table header
            const headerRow = document.createElement('tr');
            headerRow.innerHTML = `
                <th>Date</th>
                <th>Open</th>
                <th>High</th>
                <th>Low</th>
                <th>Close</th>
                <th>Pivot Range</th>
                <th>Plus/Minus</th>
            `;
            table.appendChild(headerRow);

            const dates: string[] = [];
            const avgRanges: number[] = [];

            // Create table rows
            Object.entries(last5Days).forEach(([date, values]) => {
                const open = parseFloat(values.open);
                const close = parseFloat(values.close);
                const pivotLow = parseFloat(values.pivotLow);
                const pivotHigh = parseFloat(values.pivotHigh);

                let plusMinus = 0;

                if (open < pivotLow && close > pivotHigh) {
                    plusMinus = 1;
                } else if (open > pivotHigh && close < pivotLow) {
                    plusMinus = -1;
                }

                runningSum += plusMinus; // Update running sum

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${date}</td>
                    <td>${values.open}</td>
                    <td>${values.high}</td>
                    <td>${values.low}</td>
                    <td>${values.close}</td>
                    <td>${values.pivotHigh} to ${values.pivotLow}</td>
                    <td>${plusMinus}</td>
                `;
                table.appendChild(row);

                dates.push(date);
                avgRanges.push(parseFloat(values.pivotNum));
            });

            dailyTableContainer.appendChild(table);
            stockDataDiv.textContent = `Data for ${symbol} updated successfully.`;

            // Update running sum display
            const runningSumElement = rollingPivotDiv.querySelector<HTMLSpanElement>('#running-sum');
            if (runningSumElement) {
                runningSumElement.textContent = runningSum.toString();
            }

            // Render chart
            if (chartInstance) {
                chartInstance.destroy();
            }
            chartInstance = new Chart(pivotChartCanvas, {
                type: 'line',
                data: {
                    labels: dates.reverse(), // Reverse to show chronological order
                    datasets: [
                        {
                            label: 'Pivot Num (Avg Range)',
                            data: avgRanges.reverse(),
                            borderColor: 'rgba(75, 192, 192, 1)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            borderWidth: 2,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Dates',
                            },
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Price',
                            },
                        },
                    },
                },
            });
        } catch (error) {
            console.error('Error fetching or rendering data:', error);
            stockDataDiv.textContent = `Error: ${error instanceof Error ? error.message : 'Unable to fetch data.'}`;
        }
    });

    // Reset button event listener
    resetButton.addEventListener('click', () => {
        input.value = ''; // Clear symbol input
        daysInput.value = '5'; // Reset days input to default 5
        stockDataDiv.textContent = '';
        rollingPivotDiv.innerHTML = '';
        dailyTableContainer.innerHTML = '';
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }
    });

    return dashboard;
}
