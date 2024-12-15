import { showNotification } from '../utils/notifications';

type Strategy = {
    id: string;
    name: string;
    description: string;
};

export function StrategyList(): HTMLElement {
    const strategies: Strategy[] = loadStrategiesFromLocalStorage();

    const listContainer = document.createElement('div');
    listContainer.innerHTML = `
        <h3>Strategy List</h3>
        <ul id="strategy-list">
            ${strategies.length > 0
        ? strategies
            .map(
                (strategy) => `
                <li data-id="${strategy.id}">
                    <div class="strategy-item">
                        <a href="#/strategy/${strategy.id}" class="strategy-link">
                            <h4>${strategy.name}</h4>
                            <p>${strategy.description}</p>
                        </a>
                        <button class="delete-strategy" data-id="${strategy.id}">Delete</button>
                    </div>
                </li>
            `
            )
            .join('')
        : '<p>No strategies available. Create one to get started!</p>'}
        </ul>
    `;

    listContainer.querySelectorAll<HTMLButtonElement>('.delete-strategy').forEach((button) => {
        button.addEventListener('click', () => {
            const id = button.dataset.id!;
            deleteStrategyFromLocalStorage(id);
            showNotification('Strategy deleted successfully!', 'success');

            // Re-render the list
            const updatedList = StrategyList();
            listContainer.replaceWith(updatedList);
        });
    });

    return listContainer;
}

function loadStrategiesFromLocalStorage(): Strategy[] {
    const storedStrategies = localStorage.getItem('strategies');
    return storedStrategies ? JSON.parse(storedStrategies) : [];
}

function deleteStrategyFromLocalStorage(id: string): void {
    const strategies = loadStrategiesFromLocalStorage();
    const updatedStrategies = strategies.filter((strategy) => strategy.id !== id);
    localStorage.setItem('strategies', JSON.stringify(updatedStrategies));
}
