import { fetchLast5DaysData } from '../utils/api';
import { Chart, Plugin } from 'chart.js';

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
    <div style="margin-top: 1rem;">
        <p>
            This chart, inspired by concepts from Mark Fisher's book <em><a href="http://www.thelogicaltraderonline.net/" target="_blank">The Logical Trader</a></em>, displays the 14-day, 30-day, and 50-day moving averages of the pivot numbers.
            These averages help identify trends and momentum in price action. The chart also overlays vertical lines representing daily high, low, and close prices for a detailed 
            analysis of price volatility and range. Use this visualization to spot key support and resistance levels while monitoring how price behavior aligns with historical trends. 
        </p>
    </div>
    <!--- Chart Section -->
    <div style="margin-top: 2rem; text-align: left;">
        <canvas id="pivot-chart" width="800" height="400" style="display: block; margin: 0 auto; box-sizing: border-box; max-width: 100%; max-height: 100%; height: 500px;"></canvas>
    </div>
`;


    const input = dashboard.querySelector<HTMLInputElement>('#symbol-input')!;
    const fetchButton = dashboard.querySelector<HTMLButtonElement>('#fetch-button')!;
    const resetButton = dashboard.querySelector<HTMLButtonElement>('#reset-button')!;
    const pivotChartCanvas = dashboard.querySelector<HTMLCanvasElement>('#pivot-chart')!;
    let chartInstance: Chart | null = null;

    const calculateMovingAverage = (data: number[], windowSize: number): number[] => {
        return data.map((_, index) => {
            if (index + 1 < windowSize) {
                return NaN;
            }
            const window = data.slice(index + 1 - windowSize, index + 1);
            return window.reduce((sum, value) => sum + value, 0) / window.length;
        });
    };

    // Plugin for vertical lines and close markers

    const verticalLinePlugin: Plugin<'line'> = {
        id: 'verticalLinePlugin',
        afterDraw(chart) {
            const { ctx, scales } = chart;
            const highs: number[] = chart.data.datasets[3]?.data as number[] || [];
            const lows: number[] = chart.data.datasets[4]?.data as number[] || [];
            const closes: number[] = chart.data.datasets[5]?.data as number[] || [];

            if (!highs.length || !lows.length || !closes.length) return;

            ctx.save();

            highs.forEach((high, i) => {
                const low = lows[i];
                const close = closes[i];
                const x = scales.x.getPixelForValue(i);
                const yHigh = scales.y.getPixelForValue(high);
                const yLow = scales.y.getPixelForValue(low);
                const yClose = scales.y.getPixelForValue(close);

                if (!isNaN(x) && !isNaN(yHigh) && !isNaN(yLow) && !isNaN(yClose)) {
                    // Draw high/low line
                    ctx.strokeStyle = 'gray';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(x, yHigh);
                    ctx.lineTo(x, yLow);
                    ctx.stroke();

                    // Draw close marker as a square or diamond
                    ctx.fillStyle = 'black';
                    ctx.beginPath();

                    // Square marker
                    const markerSize = 3; // Adjust size
                    ctx.rect(x - markerSize / 2, yClose - markerSize / 2, markerSize, markerSize);

                    // Uncomment below for diamond marker instead
                    /*
                    ctx.moveTo(x, yClose - markerSize / 2);
                    ctx.lineTo(x + markerSize / 2, yClose);
                    ctx.lineTo(x, yClose + markerSize / 2);
                    ctx.lineTo(x - markerSize / 2, yClose);
                    ctx.closePath();
                    */

                    ctx.fill();
                }
            });

            ctx.restore();
        },
    };


    fetchButton.addEventListener('click', async () => {
        const symbol = input.value.trim().toUpperCase();

        if (!symbol) {
            alert('Please enter a valid stock symbol.');
            return;
        }

        try {
            const data = await fetchLast5DaysData(symbol, 100);
            const allDates = Object.keys(data.last5Days).reverse();
            const allPivotNums = Object.values(data.last5Days).map(d => parseFloat(d.pivotNum)).reverse();
            const highs = Object.values(data.last5Days).map(d => parseFloat(d.high)).reverse();
            const lows = Object.values(data.last5Days).map(d => parseFloat(d.low)).reverse();
            const closes = Object.values(data.last5Days).map(d => parseFloat(d.close)).reverse();

            const dates = allDates.slice(-50);
            const pivotNums14 = calculateMovingAverage(allPivotNums, 14).slice(-50);
            const pivotNums30 = calculateMovingAverage(allPivotNums, 30).slice(-50);
            const pivotNums50 = calculateMovingAverage(allPivotNums, 50).slice(-50);

            if (chartInstance) {
                chartInstance.destroy();
            }

            Chart.register(verticalLinePlugin);

            chartInstance = new Chart(pivotChartCanvas, {
                type: 'line',
                data: {
                    labels: dates,
                    datasets: [
                        {
                            label: '14-Day Pivot Num Avg',
                            data: pivotNums14,
                            borderColor: 'rgba(75, 192, 192, 1)',
                            backgroundColor: 'rgba(75, 192, 192, 0.1)', // Semi-transparent background
                            borderWidth: 2,
                            tension: 0.4, // Smoothing for curved line
                            spanGaps: true,
                            pointRadius: 2, // Smaller point size
                            pointHoverRadius: 3, // Slightly larger on hover
                        },
                        {
                            label: '30-Day Pivot Num Avg',
                            data: pivotNums30,
                            borderColor: 'rgba(192, 75, 75, 1)',
                            backgroundColor: 'rgba(192, 75, 75, 0.1)', // Semi-transparent background
                            borderWidth: 2,
                            tension: 0.4, // Smoothing for curved line
                            spanGaps: true,
                            pointRadius: 2, // Smaller point size
                            pointHoverRadius: 3, // Slightly larger on hover
                        },
                        {
                            label: '50-Day Pivot Num Avg',
                            data: pivotNums50,
                            borderColor: 'rgba(75, 75, 192, 1)',
                            backgroundColor: 'rgba(75, 75, 192, 0.1)', // Semi-transparent background
                            borderWidth: 2,
                            tension: 0.4, // Smoothing for curved line
                            spanGaps: true,
                            pointRadius: 2, // Smaller point size
                            pointHoverRadius: 3, // Slightly larger on hover
                        },
                        {
                            label: 'Highs',
                            data: highs.slice(-50),
                        },
                        {
                            label: 'Lows',
                            data: lows.slice(-50),
                        },
                        {
                            label: 'Closes',
                            data: closes.slice(-50),
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
