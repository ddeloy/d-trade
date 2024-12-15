import { showNotification } from '../utils/notifications';

type Strategy = {
    id: string;
    name: string;
    description: string;
};

export function StrategyNew(): HTMLElement {
    const newStrategyForm = document.createElement('div');
    newStrategyForm.innerHTML = `
        <h3>Create New Strategy</h3>
        <form id="strategy-form">
            <label>
                Name:
                <input type="text" id="strategy-name" required />
            </label>
            <label>
                Description:
                <textarea id="strategy-description" required></textarea>
            </label>
            <button type="submit">Create Strategy</button>
        </form>
    `;

    const form = newStrategyForm.querySelector<HTMLFormElement>('#strategy-form')!;
    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const name = (form.querySelector<HTMLInputElement>('#strategy-name')!).value.trim();
        const description = (form.querySelector<HTMLTextAreaElement>('#strategy-description')!).value.trim();

        if (!name || !description) {
            showNotification('Please fill out all fields.', 'error');
            return;
        }

        const newStrategy: Strategy = {
            id: `${Date.now()}`, // Use timestamp as a unique ID
            name,
            description,
        };

        saveStrategyToLocalStorage(newStrategy);

        form.reset();
        showNotification('Strategy created successfully!', 'success'); // Notification on success
    });

    return newStrategyForm;
}

function saveStrategyToLocalStorage(strategy: Strategy): void {
    const strategies = loadStrategiesFromLocalStorage();
    strategies.push(strategy);
    localStorage.setItem('strategies', JSON.stringify(strategies));
}

function loadStrategiesFromLocalStorage(): Strategy[] {
    const storedStrategies = localStorage.getItem('strategies');
    return storedStrategies ? JSON.parse(storedStrategies) : [];
}
