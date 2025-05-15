import express from 'express';
import cors from 'cors';
import expressWs from 'express-ws';
import { CDPSession } from 'playwright';
import path from 'node:path';

export const createCdpProxyServer = async (cdpSession: CDPSession) => {
    const app = express();
    expressWs(app);

    app.use(cors({ origin: '*', credentials: true }));
    app.use(express.static(path.join(path.dirname(new URL(import.meta.url).pathname), '../public')));

    app.get('/health', (_req, res) => {
        res.status(200).send('OK');
    });

    (app as unknown as expressWs.Application).ws('/cdp', (ws, _req) => {
        console.info('Client connected');

        const eventHandler = (eventName: string, eventData: any) => {
            ws.send(JSON.stringify({ method: eventName, params: eventData }));
        };

        const originalEmitFn = (cdpSession as any).emit;
        (cdpSession as any).emit = (...args: any[]) => {
            const [eventName, eventData] = args;
            eventHandler(eventName, eventData);
            originalEmitFn.apply(cdpSession, args);
        };

        interface CDPCommand {
            id: number;
            method: string;
            params?: any;
        }

        ws.on('message', async (message: Buffer) => {
            const { id, method, params } = JSON.parse(message.toString('utf8')) as CDPCommand;
            try {
                const response = await cdpSession.send(method as any, params);
                ws.send(JSON.stringify({ id, result: response }));
            } catch (error) {
                ws.send(JSON.stringify({ id, error: { message: (error as Error).message ?? '' } }));
                return;
            }
        });

        ws.on('error', (err: Error) => {
            console.error(err.message);
        });

        ws.on('close', () => {
            console.info('Connection closed');
        });
    });

    // Return the app and the underlying server
    return {
        app,
        listen: (opts: { port: number }, cb: (err?: Error, address?: string) => void) => {
            const server = app.listen(opts.port, () => {
                cb(undefined, `http://localhost:${opts.port}`);
            });
            server.on('error', (err) => cb(err));
            return server;
        },
        close: (server: any) => new Promise<void>((resolve, reject) => {
            server.close((err: any) => {
                if (err) reject(err);
                else resolve();
            });
        })
    };
};
