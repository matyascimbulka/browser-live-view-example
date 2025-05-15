import { createPlaywrightRouter, createPuppeteerRouter, sleep } from 'crawlee';

export const router = createPlaywrightRouter();

router.addDefaultHandler(async ({ log, page }) => {
    log.info('Waiting for network idle');

    log.info('Sleeping for 20 minutes');
    await page.waitForTimeout(20 * 60 * 1000);
    // await sleep(20 * 60 * 1000);

    log.info('Done -> closing page');
});
