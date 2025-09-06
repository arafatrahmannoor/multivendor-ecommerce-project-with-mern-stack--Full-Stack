/**
 * Application bootstrap with resilient port handling & admin seeding (ESM).
 */
/* eslint-env node */
/* global process */
import 'dotenv/config';
import mongoose from 'mongoose';
import { pathToFileURL } from 'url';
import app from './app.js';
import ensureAdmin from './utils/ensureAdmin.js';

// Optional: silence strictQuery deprecation noise if needed
// mongoose.set('strictQuery', false);

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error('[BOOT] MONGODB_URI not set in environment. Aborting.');
    process.exit(1);
}

const BASE_PORT = Number(process.env.PORT) || 3000;
const MAX_PORT_SCAN = 5; // tries up to PORT .. PORT+4 if in use

async function connectDatabase() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('[BOOT] Connected to MongoDB');
    } catch (err) {
        console.error('[BOOT] MongoDB connection error:', err.message);
        process.exit(1);
    }
}

async function seedAdmin() {
    try {
        await ensureAdmin();
    } catch (err) {
        console.error('[BOOT] ensureAdmin failed (continuing):', err.message);
    }
}

function startHttpServer(port, attempt = 0) {
    const server = app.listen(port, () => {
        console.log(`[BOOT] Server listening on http://localhost:${port}`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE' && attempt < MAX_PORT_SCAN - 1) {
            console.warn(`[BOOT] Port ${port} in use. Trying ${port + 1} ...`);
            setTimeout(() => startHttpServer(port + 1, attempt + 1), 300);
        } else {
            console.error('[BOOT] Failed to start server:', err.message);
            process.exit(1);
        }
    });
}

// Global safety nets
process.on('unhandledRejection', (reason) => {
    console.error('[UNHANDLED REJECTION]', reason);
});
process.on('uncaughtException', (err) => {
    console.error('[UNCAUGHT EXCEPTION]', err);
    process.exit(1);
});

// Only auto-start if this file is executed directly (not imported in tests)
// Robust "is main module" check that works on Windows paths
const isMain = (() => {
    try {
        if (!process.argv[1]) return false;
        return import.meta.url === pathToFileURL(process.argv[1]).href;
    } catch {
        return false;
    }
})();

if (isMain) {
    (async () => {
        await connectDatabase();
        await seedAdmin();
        startHttpServer(BASE_PORT);
    })();
}

export { connectDatabase, seedAdmin, startHttpServer }; // for potential testing
