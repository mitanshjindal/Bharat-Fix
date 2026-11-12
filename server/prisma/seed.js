require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_lbp2seUmv3wP@ep-cool-truth-axc2inlg-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Starting database seed...');

    const blocks = [
        { name: 'Block A' },
        { name: 'Block B' },
        { name: 'Market Area' },
        { name: 'Park Zone' },
    ];

    const blockMap = {};
    for (const b of blocks) {
        const upserted = await prisma.block.upsert({
            where: { name: b.name },
            update: {},
            create: b,
        });
        blockMap[b.name] = upserted;
        console.log(`✅ Upserted block: ${upserted.name}`);
    }

    const defaultPassword = 'Admin@123';
    const passwordHash = await bcrypt.hash(defaultPassword, 12);

    // Super Admin: Mitansh
    await prisma.user.upsert({
        where: { email: 'mitanshjindal001@gmail.com' },
        update: { role: 'ADMIN', isApproved: true, approvalStatus: 'APPROVED' },
        create: {
            fullName: 'Mitansh Jindal',
            email: 'mitanshjindal001@gmail.com',
            passwordHash,
            role: 'ADMIN',
            isApproved: true,
            approvalStatus: 'APPROVED',
        },
    });
    console.log('✅ Seeded Admin: Mitansh Jindal (mitanshjindal001@gmail.com)');

    // System Super Admin
    await prisma.user.upsert({
        where: { email: 'admin@bharatfix.com' },
        update: { role: 'ADMIN', isApproved: true, approvalStatus: 'APPROVED' },
        create: {
            fullName: 'System Super Admin',
            email: 'admin@bharatfix.com',
            passwordHash,
            role: 'ADMIN',
            isApproved: true,
            approvalStatus: 'APPROVED',
        },
    });
    console.log('✅ Seeded Admin: System Super Admin (admin@bharatfix.com)');

    // Block Head
    const blockHead = await prisma.user.upsert({
        where: { email: 'blockhead@bharatfix.com' },
        update: { role: 'BLOCK_HEAD', blockId: blockMap['Block A']?.id, isApproved: true, approvalStatus: 'APPROVED' },
        create: {
            fullName: 'Block Head Supervisor',
            email: 'blockhead@bharatfix.com',
            passwordHash,
            role: 'BLOCK_HEAD',
            blockId: blockMap['Block A']?.id,
            isApproved: true,
            approvalStatus: 'APPROVED',
        },
    });
    if (blockMap['Block A']) {
        await prisma.block.update({
            where: { id: blockMap['Block A'].id },
            data: { supervisorId: blockHead.id },
        });
    }
    console.log('✅ Seeded Block Head: blockhead@bharatfix.com (Assigned to Block A)');

    // Resident Demo
    await prisma.user.upsert({
        where: { email: 'resident@bharatfix.com' },
        update: { role: 'RESIDENT', blockId: blockMap['Block A']?.id, houseNumber: 'A-101', isApproved: true, approvalStatus: 'APPROVED' },
        create: {
            fullName: 'Resident Demo User',
            email: 'resident@bharatfix.com',
            passwordHash,
            role: 'RESIDENT',
            houseNumber: 'A-101',
            blockId: blockMap['Block A']?.id,
            isApproved: true,
            approvalStatus: 'APPROVED',
        },
    });
    console.log('✅ Seeded Resident: resident@bharatfix.com (Block A, A-101)');

    console.log('✨ Seeding finished.');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
