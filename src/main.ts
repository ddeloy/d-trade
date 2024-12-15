import './style.css';
import { Header } from './components/Header';
import { Overview } from './components/Overview';
import { PivotDashboard } from './components/PivotDashboard.ts';
import { Trades } from './components/Trades';
import { Settings } from './components/Settings';
import { StrategyPage } from './components/StrategyPage';
import { addRoute, initRouter } from './utils/router';
import {ProfileDashboard} from "./components/MarketProfileDashboard.ts";

// Get the main app container
const app = document.querySelector<HTMLDivElement>('#app')!;

// Add the header to the app
console.log('[DEBUG] Adding header');
app.appendChild(Header());

// Add the main content area
const mainContent = document.createElement('div');
mainContent.id = 'main-content';
app.appendChild(mainContent);

// Define top-level routes
console.log('[DEBUG] Adding routes');
addRoute('/', Overview);
addRoute('/dashboard', PivotDashboard);
addRoute('/market-profile', ProfileDashboard);
addRoute('/trades', Trades);
addRoute('/settings', Settings);
addRoute('/strategy', StrategyPage); // Delegate /strategy and nested routes to StrategyPage

// Initialize the router
console.log('[DEBUG] Initializing router');
initRouter(mainContent);