import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

console.log('Available models:')
console.log(Object.keys(prisma).filter(key => typeof prisma[key] === 'object' && prisma[key].findMany))
