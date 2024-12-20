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
    <div style="margin-top: 2rem; text-align: left;">
        <canvas id="pivot-chart" width="800" height="400" style="display: block; margin: 0 auto; box-sizing: border-box; max-width: 100%; max-height: 100%; height: 500px;"></canvas>
    </div>
    `;

    const input = dashboard.querySelector<HTMLInputElement>('#symbol-input')!;
    const fetchButton = dashboard.querySelector<HTMLButtonElement>('#fetch-button')!;
    const resetButton = dashboard.querySelector<HTMLButtonElement>('#reset-button')!;
    const pivotChartCanvas = dashboard.querySelector<HTMLCanvasElement>('#pivot-chart')!;
    let chartInstance: Chart | null = null;

    // Function to calculate moving averages
    const calculateMovingAverage = (data: number[], windowSize: number): number[] => {
        return data.map((_, index) => {
            if (index + 1 < windowSize) {
                return NaN; // Ensure compatibility with Chart.js by using NaN
            }
            const window = data.slice(index + 1 - windowSize, index + 1);
            return window.reduce((sum, value) => sum + value, 0) / window.length;
        });
    };

    fetchButton.addEventListener('click', async () => {
        const symbol = input.value.trim().toUpperCase();

        if (!symbol) {
            alert('Please enter a valid stock symbol.');
            return;
        }

        try {
            // Fetch data for 100 days to account for historical data needed
            const data = await fetchLast5DaysData(symbol, 100);
            const allDates = Object.keys(data.last5Days).reverse();
            const allPivotNums = Object.values(data.last5Days).map(d => parseFloat(d.pivotNum)).reverse();

            // Extract the most recent 50 days for the chart
            const dates = allDates.slice(-50);

            // Calculate moving averages using the full dataset
            const pivotNums14 = calculateMovingAverage(allPivotNums, 14).slice(-50);
            const pivotNums30 = calculateMovingAverage(allPivotNums, 30).slice(-50);
            const pivotNums50 = calculateMovingAverage(allPivotNums, 50).slice(-50);

            // Render overlay chart
            if (chartInstance) {
                chartInstance.destroy();
            }
            chartInstance = new Chart(pivotChartCanvas, {
                type: 'line',
                data: {
                    labels: dates,
                    datasets: [
                        {
                            label: '14-Day Pivot Num Avg',
                            data: pivotNums14.filter(val => !isNaN(val)), // Filter out NaN values
                            borderColor: 'rgba(75, 192, 192, 1)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            borderWidth: 2,
                            spanGaps: true,
                        },
                        {
                            label: '30-Day Pivot Num Avg',
                            data: pivotNums30.filter(val => !isNaN(val)),
                            borderColor: 'rgba(192, 75, 75, 1)',
                            backgroundColor: 'rgba(192, 75, 75, 0.2)',
                            borderWidth: 2,
                            spanGaps: true,
                        },
                        {
                            label: '50-Day Pivot Num Avg',
                            data: pivotNums50.filter(val => !isNaN(val)),
                            borderColor: 'rgba(75, 75, 192, 1)',
                            backgroundColor: 'rgba(75, 75, 192, 0.2)',
                            borderWidth: 2,
                            spanGaps: true,
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

            alert(`Data for ${symbol} updated successfully.`);
        } catch (error) {
            console.error('Error fetching or rendering data:', error);
            alert(`Error: ${error instanceof Error ? error.message : 'Unable to fetch data.'}`);
        }
    });

    resetButton.addEventListener('click', () => {
        input.value = '';
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }
    });

    return dashboard;
}
