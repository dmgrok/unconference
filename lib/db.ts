// Deprecated: use '~/lib/prisma' or '~/lib/database'
// Keeping this file as a thin re-export to avoid breaking any lingering imports.
import prisma, { prisma as prismaClient } from './prisma'
export { prismaClient as prisma }
export default prisma
