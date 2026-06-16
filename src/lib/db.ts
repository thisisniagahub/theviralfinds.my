import { PrismaClient } from '@prisma/client'

// Bump this whenever the Prisma schema changes to force the dev server to
// create a fresh PrismaClient (with the newly-generated model delegates).
// Without this, the globalForPrisma singleton retains a stale client that
// doesn't know about newly-added models (e.g. SocialAccount, PostLog).
const PRISMA_SCHEMA_VERSION = 'social-accounts-v2'

const globalForPrisma = globalThis as unknown as {
  __prismaVersion?: string
  prisma: PrismaClient | undefined
}

// If the schema version changed (e.g. after `db:push` added new models),
// discard the old client so a fresh one is created with the new delegates.
if (globalForPrisma.__prismaVersion !== PRISMA_SCHEMA_VERSION) {
  if (globalForPrisma.prisma) {
    try {
      void globalForPrisma.prisma.$disconnect()
    } catch {
      // ignore
    }
  }
  globalForPrisma.prisma = undefined
  globalForPrisma.__prismaVersion = PRISMA_SCHEMA_VERSION
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db