import { StrategyList } from './StrategyList';
import { StrategyNew } from './StrategyNew';
import { StrategyDetails } from './StrategyDetails';

export function StrategyPage(): HTMLElement {
    console.log('[DEBUG] Rendering StrategyPage');

    const strategyPage = document.createElement('div');
    strategyPage.className = 'strategy-page';

    strategyPage.innerHTML = `
        <div class="strategy-sidebar">
            <nav>
                <ul>
                    <li><a href="#/strategy/list" class="sidebar-link">View Strategies</a></li>
                    <li><a href="#/strategy/new" class="sidebar-link">Create New Strategy</a></li>
                </ul>
            </nav>
        </div>
        <div id="strategy-content" class="strategy-content">
            <h3>Welcome to the Strategy Page</h3>
            <p>Select an option from the left menu to get started.</p>
        </div>
    `;

    const contentArea = strategyPage.querySelector<HTMLDivElement>('#strategy-content')!;

    const renderNestedRoute = () => {
        const currentPath = window.location.hash.slice(1);

        if (currentPath === '/strategy/list') {
            console.log('[DEBUG] Rendering StrategyList');
            contentArea.innerHTML = '';
            contentArea.appendChild(StrategyList());
        } else if (currentPath === '/strategy/new') {
            console.log('[DEBUG] Rendering StrategyNew');
            contentArea.innerHTML = '';
            contentArea.appendChild(StrategyNew());
        } else if (currentPath.startsWith('/strategy/')) {
            const id = currentPath.split('/')[2]; // Extract the strategy ID
            console.log(`[DEBUG] Rendering StrategyDetails for ID: ${id}`);
            contentArea.innerHTML = '';
            contentArea.appendChild(StrategyDetails({ id }));
        } else {
            console.log('[DEBUG] Rendering default StrategyPage content');
            contentArea.innerHTML = `
                <h3>Welcome to the Strategy Page</h3>
                <p>Select an option from the left menu to get started.</p>
            `;
        }
    };

    // Handle initial route and listen for changes
    renderNestedRoute();
    window.addEventListener('hashchange', () => {
        if (window.location.hash.startsWith('#/strategy')) {
            renderNestedRoute();
        }
    });

    return strategyPage;
}
