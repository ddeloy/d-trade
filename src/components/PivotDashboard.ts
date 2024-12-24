import { fetchLast5DaysData } from '../utils/api';
import { Chart } from 'chart.js/auto';

export function PivotDashboard(): HTMLElement {
    const dashboard = document.createElement('div');

    dashboard.innerHTML = `
    <h2>Pivot Trading Dashboard</h2>
    <div>
        <h4>Enter a stock symbol and click 'Fetch Data' to load Pivot Moving Averages</h4>
        <input id="symbol-input" type="text" placeholder="Enter stock symbol" />
        <button id="fetch-button">Fetch Data</button>
        <button id="reset-button" style="margin-left: 8px;">Reset</button>
    </div>
    <div id="stock-data" style="margin-top: 1rem;"></div>
    <div style="margin-top: 2rem; text-align: left;">
        <canvas id="pivot-chart" width="800" height="400" style="display: block; margin: 0 auto; box-sizing: border-box; max-width: 100%; max-height: 100%; height: 500px;"></canvas>
    </div>
    `;

    const input = dashboard.querySelector<HTMLInputElement>('#symbol-input')!;
    const fetchButton = dashboard.querySelector<HTMLButtonElement>('#fetch-button')!;
    const resetButton = dashboard.querySelector<HTMLButtonElement>('#reset-button')!;
    const stockDataDiv = dashboard.querySelector<HTMLDivElement>('#stock-data')!;
    const pivotChartCanvas = dashboard.querySelector<HTMLCanvasElement>('#pivot-chart')!;
    let chartInstance: Chart | null = null;

    fetchButton.addEventListener('click', async () => {
        const symbol = input.value.trim().toUpperCase();

        if (!symbol) {
            stockDataDiv.textContent = 'Please enter a valid stock symbol.';
            return;
        }

        try {
            stockDataDiv.textContent = 'Loading...';

            const { last5Days } = await fetchLast5DaysData(symbol, 50);

            const dates: string[] = Object.keys(last5Days).reverse();
            const pivotPoints: number[] = Object.values(last5Days).map(d => (parseFloat(d.high) + parseFloat(d.low) + parseFloat(d.close)) / 3).reverse();

            const calculateMovingAverage = (data: number[], period: number) => {
                const averages = [];
                for (let i = 0; i < data.length; i++) {
                    if (i < period - 1) {
                        averages.push(NaN);
                    } else {
                        const sum = data.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val, 0);
                        averages.push(sum / period);
                    }
                }
                return averages;
            };

            const ma14 = calculateMovingAverage(pivotPoints, 14);
            const ma30 = calculateMovingAverage(pivotPoints, 30);
            const ma50 = calculateMovingAverage(pivotPoints, 50);

            if (chartInstance) {
                chartInstance.destroy();
            }
            chartInstance = new Chart(pivotChartCanvas, {
                type: 'line',
                data: {
                    labels: dates,
                    datasets: [
                        {
                            label: '14-Day Moving Average',
                            data: ma14,
                            borderColor: 'black',
                            borderWidth: 2,
                            borderDash: [],
                        },
                        {
                            label: '30-Day Moving Average',
                            data: ma30,
                            borderColor: 'black',
                            borderWidth: 2,
                            borderDash: [5, 5],
                        },
                        {
                            label: '50-Day Moving Average',
                            data: ma50,
                            borderColor: 'black',
                            borderWidth: 2,
                            borderDash: [2, 2],
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

            stockDataDiv.textContent = `Data for ${symbol} updated successfully.`;
        } catch (error) {
            console.error('Error fetching or rendering data:', error);
            stockDataDiv.textContent = `Error: ${error instanceof Error ? error.message : 'Unable to fetch data.'}`;
        }
    });

    resetButton.addEventListener('click', () => {
        input.value = '';
        stockDataDiv.textContent = '';
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }
    });

    return dashboard;
}
