type Route = {
    path: string;
    render: () => HTMLElement;
};

const routes: Route[] = [];

export function addRoute(path: string, render: () => HTMLElement): void {
    console.log(`[DEBUG] Adding route: ${path}`);
    routes.push({ path, render });
}

export function navigate(path: string): void {
    console.log(`[DEBUG] Navigating to ${path}`);
    window.location.hash = path; // Update the URL hash
}

export function initRouter(rootElement: HTMLElement): void {
    const handleNavigation = () => {
        const currentPath = window.location.hash.slice(1) || '/';
        console.log(`[DEBUG] Current path: ${currentPath}`);

        // Match exact route
        const route = routes.find((route) => route.path === currentPath);

        if (route) {
            console.log(`[DEBUG] Matched route: ${route.path}`);
            rootElement.innerHTML = '';
            rootElement.appendChild(route.render());
        } else {
            // Delegate all /strategy/* paths to the /strategy route
            const parentRoute = routes.find((route) => currentPath.startsWith(route.path) && route.path === '/strategy');
            if (parentRoute) {
                console.log(`[DEBUG] Delegating to parent route: ${parentRoute.path}`);
                rootElement.innerHTML = '';
                rootElement.appendChild(parentRoute.render());
                return;
            }

            console.log('[DEBUG] No matching route, rendering 404');
            rootElement.innerHTML = `<h2>404 - Page Not Found</h2>`;
        }
    };

    window.addEventListener('hashchange', handleNavigation);
    window.addEventListener('load', handleNavigation); // Handle initial page load
}
