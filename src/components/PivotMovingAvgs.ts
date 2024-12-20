import { fetchLast5DaysData } from '../utils/api';
import { Chart } from 'chart.js/auto';

export function PivotMovingAvgs(): HTMLElement {
    const dashboard = document.createElement('div');

    dashboard.innerHTML = `
    <h2>Pivot Moving Averages</h2>
    <div>
        <h4>Enter a stock symbol and click 'Fetch Data' to load Pivot Moving Averages</h4>
        <input id="symbol-input" type="text" placeholder="Enter stock symbol" />
        <button id="fetch-button">Fetch Data</button>
        <button id="reset-button" style="margin-left: 8px;">Reset</button>
    </div>
    <div id="rolling-pivot-data" style="margin-top: 1rem; text-align: left;"></div>
    <div style="margin-top: 2rem; text-align: left;">
        <canvas id="pivot-chart" width="800" height="400" style="display: block; margin: 0 auto; box-sizing: border-box; max-width: 100%; max-height: 100%; height: 500px;"></canvas>
    </div>
    `;

    const input = dashboard.querySelector<HTMLInputElement>('#symbol-input')!;
    const fetchButton = dashboard.querySelector<HTMLButtonElement>('#fetch-button')!;
    const resetButton = dashboard.querySelector<HTMLButtonElement>('#reset-button')!;
    const rollingPivotDiv = dashboard.querySelector<HTMLDivElement>('#rolling-pivot-data')!;
    const pivotChartCanvas = dashboard.querySelector<HTMLCanvasElement>('#pivot-chart')!;
    let chartInstance: Chart | null = null;

    fetchButton.addEventListener('click', async () => {
        const symbol = input.value.trim().toUpperCase();

        if (!symbol) {
            rollingPivotDiv.textContent = 'Please enter a valid stock symbol.';
            return;
        }

        try {
            rollingPivotDiv.textContent = 'Loading...';

            // Fetch data for 14, 30, and 50 days
            const data14 = await fetchLast5DaysData(symbol, 14);
            const data30 = await fetchLast5DaysData(symbol, 30);
            const data50 = await fetchLast5DaysData(symbol, 50);

            // Use dates from the longest time range (50 days) as x-axis labels
            const dates = Object.keys(data50.last5Days).reverse();
            const pivotNums14 = Object.values(data14.last5Days).map(d => parseFloat(d.pivotNum)).reverse();
            const pivotNums30 = Object.values(data30.last5Days).map(d => parseFloat(d.pivotNum)).reverse();
            const pivotNums50 = Object.values(data50.last5Days).map(d => parseFloat(d.pivotNum)).reverse();

            // Display rolling pivot data
            rollingPivotDiv.innerHTML = `
                <strong>Rolling 2-Day Pivot Diff:</strong> ${data14.rolling2DayPivot.rollingPivotDiff} | 
                <strong>Rolling Pivot Range:</strong> ${data14.rolling2DayPivot.rollingPivotRange}
            `;

            // Render overlay chart
            if (chartInstance) {
                chartInstance.destroy();
            }
            chartInstance = new Chart(pivotChartCanvas, {
                type: 'line',
                data: {
                    labels: dates, // Use dates from the longest range (50 days)
                    datasets: [
                        {
                            label: '14-Day Pivot Num Avg',
                            data: pivotNums14,
                            borderColor: 'rgba(75, 192, 192, 1)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            borderWidth: 2,
                        },
                        {
                            label: '30-Day Pivot Num Avg',
                            data: pivotNums30,
                            borderColor: 'rgba(192, 75, 75, 1)',
                            backgroundColor: 'rgba(192, 75, 75, 0.2)',
                            borderWidth: 2,
                        },
                        {
                            label: '50-Day Pivot Num Avg',
                            data: pivotNums50,
                            borderColor: 'rgba(75, 75, 192, 1)',
                            backgroundColor: 'rgba(75, 75, 192, 0.2)',
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
                                text: 'Pivot Num',
                            },
                        },
                    },
                },
            });

            rollingPivotDiv.textContent = `Data for ${symbol} updated successfully.`;

        } catch (error) {
            console.error('Error fetching or rendering data:', error);
            rollingPivotDiv.textContent = `Error: ${error instanceof Error ? error.message : 'Unable to fetch data.'}`;
        }
    });

    resetButton.addEventListener('click', () => {
        input.value = ''; // Clear symbol input
        rollingPivotDiv.textContent = '';
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }
    });

    return dashboard;
}
