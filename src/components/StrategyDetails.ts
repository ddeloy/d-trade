import { showNotification } from '../utils/notifications';

type Strategy = {
    id: string;
    name: string;
    description: string;
};

export function StrategyDetails({ id }: { id: string }): HTMLElement {
    const strategies = loadStrategiesFromLocalStorage();
    const strategy = strategies.find((s) => s.id === id);

    const detailsContainer = document.createElement('div');
    if (!strategy) {
        detailsContainer.innerHTML = `
            <h3>Strategy Not Found</h3>
            <p>The strategy you are looking for does not exist.</p>
        `;
        return detailsContainer;
    }

    detailsContainer.innerHTML = `
        <h3>Edit Strategy: ${strategy.name}</h3>
        <form id="edit-strategy-form">
            <label>
                Name:
                <input type="text" id="edit-strategy-name" value="${strategy.name}" required />
            </label>
            <label>
                Description:
                <textarea id="edit-strategy-description" required>${strategy.description}</textarea>
            </label>
            <button type="submit">Save Changes</button>
        </form>
    `;

    const form = detailsContainer.querySelector<HTMLFormElement>('#edit-strategy-form')!;
    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const name = (form.querySelector<HTMLInputElement>('#edit-strategy-name')!).value.trim();
        const description = (form.querySelector<HTMLTextAreaElement>('#edit-strategy-description')!).value.trim();

        if (!name || !description) {
            showNotification('Please fill out all fields.', 'error');
            return;
        }

        strategy.name = name;
        strategy.description = description;
        saveStrategiesToLocalStorage(strategies);

        showNotification('Strategy updated successfully!', 'success'); // Notification on success
    });

    return detailsContainer;
}

function loadStrategiesFromLocalStorage(): Strategy[] {
    const storedStrategies = localStorage.getItem('strategies');
    return storedStrategies ? JSON.parse(storedStrategies) : [];
}

function saveStrategiesToLocalStorage(strategies: Strategy[]): void {
    localStorage.setItem('strategies', JSON.stringify(strategies));
}
