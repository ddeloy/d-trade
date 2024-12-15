import { TimeSeriesEntry } from '../utils/api-mkt-chart.ts';

/**
 * Generate the Market Profile Table with letter mapping for each price point in 30-minute intervals.
 */
export function generateMarketProfileTable(
    data: Record<string, TimeSeriesEntry>
): Record<number, string[]> {
    const priceToLetters: Record<number, string[]> = {};
    const labels = Object.keys(data).reverse(); // Time labels
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; // Letters for intervals

    labels.forEach((timestamp, index) => {
        const intervalLetter = alphabet[index % alphabet.length]; // Cycle through letters
        const high = parseFloat(data[timestamp]['2. high']);
        const low = parseFloat(data[timestamp]['3. low']);

        // Ensure prices fall on .25 increments
        const roundedHigh = Math.ceil(high / 0.25) * 0.25; // Round up to nearest .25
        const roundedLow = Math.floor(low / 0.25) * 0.25; // Round down to nearest .25

        for (let price = roundedHigh; price >= roundedLow; price = Math.round((price - 0.25) * 100) / 100) {
            if (!priceToLetters[price]) {
                priceToLetters[price] = [];
            }
            priceToLetters[price].push(intervalLetter);
        }
    });

    return priceToLetters;
}

/**
 * Render the Market Profile Table in the provided container.
 */
export function renderMarketProfileTable(
    container: HTMLElement,
    data: Record<string, TimeSeriesEntry>
): void {
    container.innerHTML = ''; // Clear existing content

    const priceToLetters = generateMarketProfileTable(data);
    const sortedPrices = Object.keys(priceToLetters)
        .map(Number)
        .sort((a, b) => b - a); // Sort descending

    // Create the table
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';

    const headerRow = document.createElement('tr');
    headerRow.innerHTML = `
        <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Price</th>
        <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">TPOs (Time Price Opportunities)</th>
    `;
    table.appendChild(headerRow);

    sortedPrices.forEach((price) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="padding: 8px; border: 1px solid #ddd;">${price.toFixed(2)}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${priceToLetters[price].join('')}</td>
        `;
        table.appendChild(row);
    });

    container.appendChild(table);
}