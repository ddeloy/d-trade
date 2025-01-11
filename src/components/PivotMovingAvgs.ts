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
            These averages help identify trends and momentum in price action. Use this visualization to spot key support and resistance levels while monitoring how price behavior aligns with historical trends. 
        </p>
    </div>
    <div> <span class="info-icon" style="margin-top: 1rem; font-weight: bold; font-size: 1em; color: black" title="[WIP] Detect trend by analyzing PMA slope correlations relative to price.">Insights:<span style="font-weight:normal; font-size: 0.8em;"> ℹ️</span></span>
    <div id="trend-insights" style="margin-top: 0.5rem; margin-left: 0.25rem; font-weight: normal;">
    </div>
    </div>
        <div style="margin-top: 2rem; text-align: center;">
        <h4>
            Pivot Moving Averages (PMA) 
            <span class="info-icon" title="Pivot number average for 14, 30, and 50 day. The emphasis is on comparing the slope of averages to identify trend (hover over points for details).">ℹ️</span>
        </h4>
        <canvas id="pivot-chart" width="800" height="400" style="display: block; margin: 0 auto; box-sizing: border-box; max-width: 100%; max-height: 100%; height: 500px;"></canvas>
    </div>
`;

    const input = dashboard.querySelector<HTMLInputElement>('#symbol-input')!;
    const fetchButton = dashboard.querySelector<HTMLButtonElement>('#fetch-button')!;
    const resetButton = dashboard.querySelector<HTMLButtonElement>('#reset-button')!;
    const pivotChartCanvas = dashboard.querySelector<HTMLCanvasElement>('#pivot-chart')!;
    const trendInsightsDiv = dashboard.querySelector<HTMLDivElement>('#trend-insights')!;
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

    const classifyTrend = (pivot14: number[], pivot30: number[], pivot50: number[]): string => {
        const recent14 = pivot14[pivot14.length - 1];
        const recent30 = pivot30[pivot30.length - 1];
        const recent50 = pivot50[pivot50.length - 1];

        const slope14 = recent14 - pivot14[pivot14.length - 2];
        const slope30 = recent30 - pivot30[pivot30.length - 2];
        const slope50 = recent50 - pivot50[pivot50.length - 2];

        if (slope14 > 0 && slope30 > 0 && slope50 > 0) {
            return "Bullish - All averages are rising.";
        }
        if (slope14 < 0 && slope30 < 0 && slope50 < 0) {
            return "Bearish - All averages are falling.";
        }
        if (Math.abs(slope14) < 0.1 && Math.abs(slope30) < 0.1 && Math.abs(slope50) < 0.1) {
            return "Neutral - Averages are flat.";
        }
        if (slope14 < 0 && slope30 > 0 && slope50 > 0) {
            return "Nuanced Divergence - Short-term weakening, mid/long-term remain bullish.";
        }
        if (slope14 > 0 && slope30 < 0 && slope50 < 0) {
            return "Nuanced Divergence - Short-term strengthening, mid/long-term remain bearish.";
        }
        if ((recent14 > recent30 && recent14 < recent50) || (recent14 < recent30 && recent14 > recent50)) {
            return "Divergent - Possible trend reversal.";
        }
        return "Confused - No clear pattern or averages crossing.";
    };

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

                    // Draw close marker
                    ctx.fillStyle = 'black';
                    ctx.beginPath();
                    const markerSize = 4;
                    ctx.rect(x - markerSize / 2, yClose - markerSize / 2, markerSize, markerSize);
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

            const trend = classifyTrend(pivotNums14, pivotNums30, pivotNums50);
            trendInsightsDiv.textContent = `Current Market Trend: ${trend}`;

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
                            backgroundColor: 'rgba(75, 192, 192, 0.1)',
                            borderWidth: 2,
                            tension: 0.4,
                            pointRadius: 2, // Smaller point size
                            pointHoverRadius: 3, // Slightly larger on hover
                            spanGaps: true,
                        },
                        {
                            label: '30-Day Pivot Num Avg',
                            data: pivotNums30,
                            borderColor: 'rgba(192, 75, 75, 1)',
                            backgroundColor: 'rgba(192, 75, 75, 0.1)',
                            borderWidth: 2,
                            pointRadius: 2, // Smaller point size
                            pointHoverRadius: 3, // Slightly larger on hover
                            tension: 0.4,
                            spanGaps: true,
                        },
                        {
                            label: '50-Day Pivot Num Avg',
                            data: pivotNums50,
                            borderColor: 'rgba(75, 75, 192, 1)',
                            backgroundColor: 'rgba(75, 75, 192, 0.1)',
                            borderWidth: 2,
                            pointRadius: 2, // Smaller point size
                            pointHoverRadius: 3, // Slightly larger on hover
                            tension: 0.4,
                            spanGaps: true,
                        },
                        {
                            label: 'Highs',
                            data: highs.slice(-50),
                            borderColor: 'rgba(0, 0, 0, 0.1)',
                            borderWidth: 1,
                            pointRadius: 2, // Smaller point size
                            pointHoverRadius: 3, // Slightly larger on hover
                            type: 'line',
                            tension: 0,
                        },
                        {
                            label: 'Lows',
                            data: lows.slice(-50),
                            borderColor: 'rgba(0, 0, 0, 0.1)',
                            borderWidth: 1,
                            pointRadius: 2, // Smaller point size
                            pointHoverRadius: 3, // Slightly larger on hover
                            type: 'line',
                            tension: 0,
                        },
                        {
                            label: 'Closes',
                            data: closes.slice(-50),
                            borderColor: 'rgba(0, 0, 0, 0.1)',
                            borderWidth: 1,
                            pointRadius: 2, // Smaller point size
                            pointHoverRadius: 3, // Slightly larger on hover
                            type: 'line',
                            tension: 0,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    plugins: {
                        tooltip: {
                            mode: 'index',
                        },
                    },
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
        } catch (error) {
            console.error('Error fetching or rendering data:', error);
            alert(`Error: ${error instanceof Error ? error.message : 'Unable to fetch data.'}`);
        }
    });

    resetButton.addEventListener('click', () => {
        input.value = '';
        trendInsightsDiv.textContent = '';
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }
    });

    return dashboard;
}
