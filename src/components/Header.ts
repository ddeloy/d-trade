import { navigate } from '../utils/router';

export function Header(): HTMLElement {
    const header = document.createElement('header');
    header.innerHTML = `
      <!--  <h1>[WIP] Doug's Day Trading App</h1> -->
        <nav>
            <a href="#/" class="nav-link">Overview</a>
            <a href="#/dashboard" class="nav-link">Dashboard - Pivot Range</a>
            <a href="#/market-profile" class="nav-link">Dashboard - Market Profile</a>  
            <a href="#/trades" class="nav-link">Trades</a>
            <a href="#/settings" class="nav-link">Settings</a>
            <a href="#/strategy" class="nav-link">Strategy</a>
        </nav>
    `;

    // Ensure navigation is triggered
    header.querySelectorAll<HTMLAnchorElement>('.nav-link').forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default link behavior
            const href = link.getAttribute('href')!; // Get the href value
            console.log(`[DEBUG] Navigating to ${href}`); // Debugging
            navigate(href.slice(1)); // Trigger navigation (remove # symbol)
        });
    });

    return header;
}
