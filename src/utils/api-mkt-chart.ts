const API_KEY = 'ITYDRGE14LK6JC5O'; // Your Alpha Vantage API key

/**
 * Fetch real-time stock data from Alpha Vantage. EST
 */
export async function fetchIntradayData(
    symbol: string,
    interval: string = '30min',
    outputSize: 'compact' | 'full' = 'compact'
): Promise<Record<string, TimeSeriesEntry>> {
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=${interval}&outputsize=${outputSize}&entitlement=delayed&apikey=${API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Failed to fetch data for symbol: ${symbol}`);
    }

    const data = await response.json();

    if (!data[`Time Series (${interval})`]) {
        throw new Error(`No data available for symbol: ${symbol}`);
    }

    const allData = data[`Time Series (${interval})`] as Record<string, TimeSeriesEntry>;

    // Get today's date in EST
    // const now = new Date();
    const todayEST = new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York' });

    const filteredData: Record<string, TimeSeriesEntry> = {};

    // Filter intraday data to match today's trading day in EST
    for (const [timestamp, values] of Object.entries(allData)) {
        const estTime = new Date(timestamp).toLocaleString('en-US', { timeZone: 'America/New_York' });
        const [estDate] = estTime.split(', ');

        if (estDate === todayEST) {
            filteredData[timestamp] = values as TimeSeriesEntry;
        }
    }

    // Debugging: Log data ranges for today's trading
    const lowPrices = Object.values(filteredData).map((entry) => parseFloat(entry['3. low']));
    const highPrices = Object.values(filteredData).map((entry) => parseFloat(entry['2. high']));

    console.log('[DEBUG] Filtered Data:', filteredData);
    console.log('[DEBUG] Today\'s Low:', Math.min(...lowPrices));
    console.log('[DEBUG] Today\'s High:', Math.max(...highPrices));

    if (Object.keys(filteredData).length === 0) {
        throw new Error(`No intraday data available for today (${todayEST}).`);
    }

    return filteredData;
}

/**
 * Type for the intraday time series entry.
 */
export type TimeSeriesEntry = {
    '1. open': string;
    '2. high': string;
    '3. low': string;
    '4. close': string;
    '5. volume': string;
};