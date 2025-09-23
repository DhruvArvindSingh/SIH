import { PrismaClient } from '../generated/prisma/index.js';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL as string;

let postgresClient: PrismaClient | null = null;
let isConnected = false;
let reconnectAttempts = 0;
let isReconnecting = false;
const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_RETRY_DELAY = 1000; // 1 second

let resolveDbReady: () => void;
const postgresDbReady = new Promise<void>((resolve) => {
    resolveDbReady = resolve;
});

// Helper function to calculate exponential backoff delay
function getRetryDelay(attempt: number): number {
    return Math.min(BASE_RETRY_DELAY * Math.pow(2, attempt), 30000); // Max 30 seconds
}

function setupConnectionHandlers() {
    if (!postgresClient) return;

    // Handle graceful shutdown - only disconnect database, don't exit process
    process.on('SIGINT', async () => {
        if (postgresClient) {
            await postgresClient.$disconnect();
            console.log('🔌 PostgreSQL Prisma client disconnected');
        }
        // Don't call process.exit(0) here - let the main application handle shutdown
    });

    process.on('SIGTERM', async () => {
        if (postgresClient) {
            await postgresClient.$disconnect();
            console.log('🔌 PostgreSQL Prisma client disconnected');
        }
        // Don't call process.exit(0) here - let the main application handle shutdown
    });
}


function scheduleReconnect() {
    if (isReconnecting) return;

    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error(`❌ PostgreSQL max reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Giving up.`);
        isReconnecting = false;
        return;
    }

    isReconnecting = true;
    const delay = getRetryDelay(reconnectAttempts);
    reconnectAttempts++;

    console.log(`🔄 Scheduling PostgreSQL reconnection attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms`);

    setTimeout(async () => {
        try {
            await initPostgresClient();
        } catch (error) {
            console.error('PostgreSQL reconnection attempt failed:', error);
        } finally {
            isReconnecting = false;
        }
    }, delay);
}

async function initPostgresClient() {
    try {
        if (!DATABASE_URL) {
            console.warn("⚠️  DATABASE_URL not configured. PostgreSQL features will be disabled.");
            return;
        }

        console.log("🔗 Attempting to connect to PostgreSQL database...");
        postgresClient = new PrismaClient({
            datasources: {
                db: {
                    url: DATABASE_URL
                }
            },
            log: ['error', 'warn'],
        });

        // Test the connection
        await postgresClient.$connect();

        // Setup connection event handlers
        setupConnectionHandlers();

        isConnected = true;
        reconnectAttempts = 0; // Reset on successful connection
        console.log("✅ PostgreSQL database connected successfully via Prisma");
        resolveDbReady();
    } catch (e) {
        console.warn("⚠️  Unable to connect to PostgreSQL database. PostgreSQL features will be disabled.");
        console.warn("PostgreSQL database error:", e instanceof Error ? e.message : e);
        postgresClient = null;
        isConnected = false;

        // Schedule reconnection attempt only if not already reconnecting
        if (!isReconnecting) {
            scheduleReconnect();
        }
    }
}

// Function to manually trigger reconnection (useful for testing)
export function reconnectPostgresDatabase() {
    if (postgresClient) {
        postgresClient.$disconnect();
    }
    reconnectAttempts = 0;
    isReconnecting = false;
    initPostgresClient();
}

// Function to get the client instance
export function getPostgresClient(): PrismaClient | null {
    return postgresClient;
}

// Initialize database connection (non-blocking)
initPostgresClient().catch(() => {
    // Error already handled in initPostgresClient
});

export { postgresClient, isConnected as postgresConnected, postgresDbReady, initPostgresClient };
export default postgresClient;
