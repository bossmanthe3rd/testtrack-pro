import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.findFirst();
  console.log("VALID_PROJECT_ID=" + (project ? project.id : "NONE"));
}

main().catch(console.error).finally(() => prisma.$disconnect());
