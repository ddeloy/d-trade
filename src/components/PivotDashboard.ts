import { fetchLast5DaysData } from '../utils/api';
import { Chart } from 'chart.js/auto';

export function PivotDashboard(): HTMLElement {
    const dashboard = document.createElement('div');

    dashboard.innerHTML = `
    <h2>Pivot Trading Dashboard</h2>
    <div>
        <h4>Enter a valid symbol, click 'Fetch Data' to load real-time data from Alpha Vantage API (15-min delay)</h4>
        <input id="symbol-input" type="text" placeholder="Enter stock symbol" />
        <button id="fetch-button">Fetch Data</button>
    </div>
    <div id="stock-data" style="margin-top: 1rem;"></div>
    <div id="rolling-pivot-data" style="margin-top: 1rem; text-align: left;"></div>
    <div id="daily-table-container" style="margin-top: 2rem;">
        <h3 style="text-align:left">Data for Rolling Last 5 Trading Days</h3>
    </div>
    <div style="margin-top: 2rem; text-align: left;">
        <canvas id="pivot-chart" width="800" height="400" style="display: block; margin: 0px; box-sizing: border-box; max-width: 60%; height: 500px;"></canvas>
    </div>
    `;

    const input = dashboard.querySelector<HTMLInputElement>('#symbol-input')!;
    const button = dashboard.querySelector<HTMLButtonElement>('#fetch-button')!;
    const stockDataDiv = dashboard.querySelector<HTMLDivElement>('#stock-data')!;
    const rollingPivotDiv = dashboard.querySelector<HTMLDivElement>('#rolling-pivot-data')!;
    const dailyTableContainer = dashboard.querySelector<HTMLDivElement>('#daily-table-container')!;
    const pivotChartCanvas = dashboard.querySelector<HTMLCanvasElement>('#pivot-chart')!;
    let chartInstance: Chart | null = null;

    button.addEventListener('click', async () => {
        const symbol = input.value.trim().toUpperCase();
        if (!symbol) {
            stockDataDiv.textContent = 'Please enter a valid stock symbol.';
            return;
        }

        try {
            stockDataDiv.textContent = 'Loading...';

            const { last5Days, rolling2DayPivot } = await fetchLast5DaysData(symbol);

            // Display rolling 2-day pivot data
            rollingPivotDiv.innerHTML = `
                <strong>Rolling 2-Day Pivot Diff:</strong> ${rolling2DayPivot.rollingPivotDiff} | 
                <strong>Rolling Pivot Range:</strong> ${rolling2DayPivot.rollingPivotRange}
            `;

            // Clear existing table
            dailyTableContainer.innerHTML = '';

            // Create new table
            const table = document.createElement('table');
            table.style.width = 'fit-content';
            table.style.borderCollapse = 'collapse';

            const headerRow = document.createElement('tr');
            headerRow.innerHTML = `
                <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Date</th>
                <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Open</th>
                <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">High</th>
                <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Low</th>
                <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Close</th>
                <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Pivot Range</th>
                <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Plus/Minus</th>
            `;
            table.appendChild(headerRow);

            const dates: string[] = [];
            const avgRanges: number[] = [];

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

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td style="padding: 8px; border: 1px solid #ddd;">${date}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${values.open}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${values.high}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${values.low}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${values.close}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${values.pivotHigh} to <br/>${values.pivotLow}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${plusMinus}</td>
                `;
                table.appendChild(row);

                // Prepare data for chart
                dates.push(date);
                avgRanges.push(parseFloat(values.pivotNum));
            });

            dailyTableContainer.appendChild(table);
            stockDataDiv.textContent = `Data for ${symbol} updated successfully.`;

            // Render chart (if needed)
            if (chartInstance) {
                chartInstance.destroy();
            }
            chartInstance = new Chart(pivotChartCanvas, {
                type: 'line',
                data: {
                    labels: dates.reverse(), // Reverse for chronological order
                    datasets: [
                        {
                            label: 'Pivot Num (Avg Range)',
                            data: avgRanges.reverse(), // Reverse for chronological order
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

    return dashboard;
}
