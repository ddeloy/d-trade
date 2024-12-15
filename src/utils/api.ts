const API_KEY = 'ITYDRGE14LK6JC5O'; // Your Alpha Vantage API key

// Define the DailyData type
export type DailyData = {
    open: string;
    high: string;
    low: string;
    close: string;
    pivotNum: string;
    pivotDiff: string;
    pivotHigh: string;
    pivotLow: string;
    avgRange: string;
};

// Define the RollingPivotData type
export type RollingPivotData = {
    rollingPivotDiff: string;
    rollingPivotRange: string;
};

// Function to fetch last 5 days of data
export async function fetchLast5DaysData(symbol: string): Promise<{
    last5Days: Record<string, DailyData>;
    rolling2DayPivot: RollingPivotData;
}> {
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&outputsize=full&apikey=${API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Failed to fetch data for symbol: ${symbol}`);
    }

    const data = await response.json();

    if (!data['Time Series (Daily)']) {
        throw new Error(`No daily data available for symbol: ${symbol}`);
    }

    const allData = data['Time Series (Daily)'] as Record<string, any>;

    // Ensure we only use dates where regular trading hours have ended (4:00 PM EST)
    const today = new Date();
    const marketClosed = new Date();
    marketClosed.setHours(16, 0, 0, 0); // 4:00 PM EST

    const isTodayRegularSessionClosed = today > marketClosed;

    const validDates = Object.keys(allData)
        .filter((date) => {
            const isPast = new Date(date) < today;
            const isTodayAndClosed = date === today.toISOString().split('T')[0] && isTodayRegularSessionClosed;
            return isPast || isTodayAndClosed;
        })
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()); // Descending order

    const last5DaysData: Record<string, DailyData> = {};
    // slice determines num of days to fetch and plot
    validDates.slice(0, 5).forEach((date) => {
        const dayData = allData[date];
        const open = parseFloat(dayData['1. open']);
        const high = parseFloat(dayData['2. high']);
        const low = parseFloat(dayData['3. low']);
        const close = parseFloat(dayData['4. close']);

        const pivotNum = (high + low + close) / 3;
        const avgRange = (high + low) / 2;
        const pivotDiff = Math.abs(pivotNum - avgRange);

        const pivotHigh = (avgRange + pivotDiff).toFixed(2);
        const pivotLow = (avgRange - pivotDiff).toFixed(2);

        last5DaysData[date] = {
            open: open.toFixed(2),
            high: high.toFixed(2),
            low: low.toFixed(2),
            close: close.toFixed(2),
            avgRange: avgRange.toFixed(2),
            pivotNum: pivotNum.toFixed(2),
            pivotDiff: pivotDiff.toFixed(2),
            pivotHigh,
            pivotLow,
        };
    });

    // Calculate rolling 2-day pivot range
    let rolling2DayPivot: RollingPivotData = {
        rollingPivotDiff: 'N/A',
        rollingPivotRange: 'N/A',
    };

    if (validDates.length >= 2) {
        const day1 = allData[validDates[0]];
        const day2 = allData[validDates[1]];

        const rollingPivotHigh = Math.max(parseFloat(day1['2. high']), parseFloat(day2['2. high']));
        const rollingPivotLow = Math.min(parseFloat(day1['3. low']), parseFloat(day2['3. low']));
        const rollingPivotClose = parseFloat(day1['4. close']);

        const avgRollingRange = (rollingPivotHigh + rollingPivotLow + rollingPivotClose) / 3;
        const rollingPivotNum = (rollingPivotHigh + rollingPivotLow) / 2;
        const rollingPivotDiff = Math.abs(avgRollingRange - rollingPivotNum);

        const rollingPivotHighValue = (rollingPivotNum + rollingPivotDiff).toFixed(2);
        const rollingPivotLowValue = (rollingPivotNum - rollingPivotDiff).toFixed(2);

        rolling2DayPivot = {
            rollingPivotDiff: rollingPivotDiff.toFixed(2),
            rollingPivotRange: `${rollingPivotHighValue} to ${rollingPivotLowValue}`,
        };
    }

    return { last5Days: last5DaysData, rolling2DayPivot };
}
