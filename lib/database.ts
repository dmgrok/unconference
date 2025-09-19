// Re-export the unified Prisma client from prisma.ts
import prisma, { prisma as prismaClient } from './prisma'

export { prismaClient as prisma }
export default prisma