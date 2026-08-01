const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const env = require('./env');

const DEFAULT_NEON_URL = "postgresql://neondb_owner:npg_lbp2seUmv3wP@ep-cool-truth-axc2inlg-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require";
const connectionString = env.DATABASE_URL || process.env.DATABASE_URL || DEFAULT_NEON_URL;


// Global singleton instance for PrismaClient (prevents connection pool exhaustion in Vercel serverless)
const globalForPrisma = globalThis;

if (!globalForPrisma.prisma) {
    const pool = new Pool({
        connectionString,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
    });

    pool.on('error', (err) => {
        console.error('Unexpected error on idle pg client', err.message);
    });

    const adapter = new PrismaPg(pool);
    globalForPrisma.prisma = new PrismaClient({ adapter });
    globalForPrisma.pgPool = pool;
}

const prisma = globalForPrisma.prisma;

module.exports = prisma;

