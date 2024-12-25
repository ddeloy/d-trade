export function Settings(): HTMLElement {
    const settingsPage = document.createElement('div');

    // HTML structure for the Settings page
    settingsPage.innerHTML = `
        <h2>Settings</h2>
        <div><p><b>[WIP]</b> Functionality not fully integrated/wired up just yet</p></div>
        <section id="user-preferences">
            <h3>User Preferences</h3>
            <label>
                Theme:
                <select id="theme-selector">
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System Default</option>
                </select>
            </label>
        </section>
        <section id="application-settings">
            <h3>Application Settings</h3>
            <label>
                Default Trade Quantity:
                <input type="number" id="default-trade-quantity" min="1" value="1" />
            </label>
            <label>
                Enable Trade Confirmation:
                <input type="checkbox" id="trade-confirmation-toggle" checked />
            </label>
        </section>
        <section id="data-management">
            <h3>Data Management</h3>
            <button id="export-data">Export Data</button>
            <button id="import-data">Import Data</button>
            <button id="clear-storage">Clear All Data</button>
        </section>
    `;

    // User Preferences

    // Theme Selection
    const themeSelector = settingsPage.querySelector<HTMLSelectElement>('#theme-selector')!;
    themeSelector.addEventListener('change', () => {
        const selectedTheme = themeSelector.value;
        document.body.dataset.theme = selectedTheme; // Apply theme to the app
        localStorage.setItem('theme', selectedTheme); // Save preference
    });

    // Apply saved theme on load
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        themeSelector.value = savedTheme;
        document.body.dataset.theme = savedTheme;
    }

    // Application Settings

    // Default Trade Quantity
    const defaultQuantityInput = settingsPage.querySelector<HTMLInputElement>('#default-trade-quantity')!;
    defaultQuantityInput.addEventListener('input', () => {
        const defaultQuantity = parseInt(defaultQuantityInput.value, 10);
        localStorage.setItem('defaultTradeQuantity', defaultQuantity.toString());
    });

    // Load saved default quantity on load
    const savedDefaultQuantity = localStorage.getItem('defaultTradeQuantity');
    if (savedDefaultQuantity) {
        defaultQuantityInput.value = savedDefaultQuantity;
    }

    // Trade Confirmation Toggle
    const tradeConfirmationToggle = settingsPage.querySelector<HTMLInputElement>('#trade-confirmation-toggle')!;
    tradeConfirmationToggle.addEventListener('change', () => {
        const isEnabled = tradeConfirmationToggle.checked;
        localStorage.setItem('tradeConfirmation', isEnabled.toString());
    });

    // Load saved trade confirmation setting on load
    const savedTradeConfirmation = localStorage.getItem('tradeConfirmation');
    if (savedTradeConfirmation !== null) {
        tradeConfirmationToggle.checked = savedTradeConfirmation === 'true';
    }

    // Data Management

    // Export Data
    const exportDataButton = settingsPage.querySelector<HTMLButtonElement>('#export-data')!;
    exportDataButton.addEventListener('click', () => {
        const data = {
            plannedTrades: JSON.parse(localStorage.getItem('plannedTrades') || '[]'),
            theme: localStorage.getItem('theme'),
            defaultTradeQuantity: localStorage.getItem('defaultTradeQuantity'),
            tradeConfirmation: localStorage.getItem('tradeConfirmation'),
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'trade_data.json';
        link.click();

        URL.revokeObjectURL(url);
    });

    // Import Data
    const importDataButton = settingsPage.querySelector<HTMLButtonElement>('#import-data')!;
    importDataButton.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.addEventListener('change', (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const importedData = JSON.parse(reader.result as string);
                    if (importedData.plannedTrades) localStorage.setItem('plannedTrades', JSON.stringify(importedData.plannedTrades));
                    if (importedData.theme) localStorage.setItem('theme', importedData.theme);
                    if (importedData.defaultTradeQuantity) localStorage.setItem('defaultTradeQuantity', importedData.defaultTradeQuantity);
                    if (importedData.tradeConfirmation) localStorage.setItem('tradeConfirmation', importedData.tradeConfirmation);

                    alert('Data imported successfully. Refresh the page to apply changes.');
                } catch (error) {
                    alert('Invalid file format. Please upload a valid JSON file.');
                }
            };

            reader.readAsText(file);
        });

        input.click();
    });

    // Clear All Data
    const clearStorageButton = settingsPage.querySelector<HTMLButtonElement>('#clear-storage')!;
    clearStorageButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all data?')) {
            localStorage.clear();
            alert('All data has been cleared.');
        }
    });

    return settingsPage;
}
