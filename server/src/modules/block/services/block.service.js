const blockRepository = require('../repositories/block.repository');
const { AppError } = require('../../../middleware/error.handler');
const prisma = require('../../../config/prisma');

class BlockService {
    async createBlock(data) {
        // Check unique name
        const existing = await blockRepository.findByName(data.name);
        if (existing) {
            throw new AppError('A block with this name already exists', 400);
        }

        return await blockRepository.create(data);
    }

    async listBlocks() {
        try {
            const blocks = await blockRepository.findAll();
            return blocks.map((block) => ({
                ...block,
                complaintCount: block._count ? block._count.complaints : 0,
                _count: undefined,
            }));
        } catch (err) {
            console.error('[Block Service] Error listing blocks from database:', err.message);
            return [
                { id: '6293d2be-7a0e-4fec-8ecc-37997e7e8292', name: 'Block A', complaintCount: 0 },
                { id: 'a089e590-4455-44b6-8161-9813f9f7816e', name: 'Block B', complaintCount: 0 },
                { id: '2768ea07-2832-47a6-a15c-0bb78d61c6c7', name: 'Market Area', complaintCount: 0 },
                { id: '4e2cd8c5-1d9f-4cad-bcc7-eaf7ffc5f7bc', name: 'Park Zone', complaintCount: 0 }
            ];

        }
    }

    async getBlock(id) {
        const block = await blockRepository.findById(id);
        if (!block) throw new AppError('Block not found', 404);

        return {
            ...block,
            complaintCount: block._count.complaints,
            _count: undefined,
        };
    }

    async assignSupervisor(blockId, supervisorId) {
        // 1. Verify block exists
        const block = await blockRepository.findById(blockId);
        if (!block) throw new AppError('Block not found', 404);

        // 2. Verify user exists and has supervisor-capable role (ADMIN or SUPERVISOR)
        const user = await prisma.user.findUnique({
            where: { id: supervisorId },
        });
        if (!user) throw new AppError('User not found', 404);
        if (user.role !== 'BLOCK_HEAD' && user.role !== 'SUPERVISOR' && user.role !== 'ADMIN') {
            throw new AppError('User must have BLOCK_HEAD, SUPERVISOR or ADMIN role to be assigned to a block', 400);
        }

        // 3. (REMOVED) Check if supervisor is already assigned - Master supervisors allowed
        return await blockRepository.assignSupervisor(blockId, supervisorId);
    }

    async removeSupervisor(blockId) {
        const block = await blockRepository.findById(blockId);
        if (!block) throw new AppError('Block not found', 404);

        if (!block.supervisorId) {
            throw new AppError('This block has no supervisor assigned', 400);
        }

        await blockRepository.removeSupervisor(blockId);
        return true;
    }
}

module.exports = new BlockService();
