import { Actor } from 'apify';
import { PlaywrightCrawler, ProxyConfigurationOptions } from 'crawlee';

import { createCdpProxyServer } from './cdp-proxy-server.js';
import { router } from './routes.js';

interface Input {
    url: string;
    proxyConfiguration: ProxyConfigurationOptions;
}

await Actor.init();

const { containerUrl, containerPort } = Actor.getEnv();

// const CONTAINER_HOST = Actor.isAtHome() ? containerUrl : 'localhost';
// const CONTAINER_PORT = containerPort;
// const CHROME_DEBUGGING_PORT = 9222;

const {
    url = 'https://www.apify.com',
    proxyConfiguration: proxyConfigurationOptions = { useApifyProxy: true },
} = await Actor.getInput<Input>() ?? {} as Input;

const proxyConfiguration = await Actor.createProxyConfiguration(proxyConfigurationOptions);

let server: any | undefined;
let httpServer: any | undefined;

const crawler = new PlaywrightCrawler({
    proxyConfiguration,
    requestHandler: router,
    maxConcurrency: 1,
    requestHandlerTimeoutSecs: 3600, // 1 hour
    navigationTimeoutSecs: 3600,
    headless: true,
    launchContext: {
        launchOptions: {
            args: [
                // `--remote-debugging-port=${CHROME_DEBUGGING_PORT}`, // Enable remote debugging
                // '--remote-debugging-address=0.0.0.0',
            ],
        },
    },
    preNavigationHooks: [
        async ({ page }) => {
            const context = page.context();
            const client = await context.newCDPSession(page);

            // Create the proxy server
            server = await createCdpProxyServer(client);
            httpServer = server.listen({ port: containerPort ?? 4321 }, (err: any, address?: string) => {
                if (err) {
                    console.error('Error starting server:', err);
                    return;
                }

                console.log(`Listening on ${address}`);
            });
        },
    ],
});

await crawler.run([{ url }]);

if (server && httpServer) {
    console.log('Closing server');
    await server.close(httpServer);
}

await Actor.exit();
