import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Fix the corrupted importantInfo field - set it to a valid empty JSON array
    const result = await prisma.$executeRaw`
      UPDATE Tour 
      SET importantInfo = '[]' 
      WHERE id = 'cmnuijw8t0000okcc68y91gw9'
    `;
    console.log(`✅ Fixed! Updated ${result} row(s). importantInfo is now '[]'`);
    
    // Verify the fix
    const tour = await prisma.tour.findUnique({
      where: { id: "cmnuijw8t0000okcc68y91gw9" },
      include: { images: { orderBy: { order: "asc" } } },
    });
    console.log(`✅ Verification passed! Tour "${tour.title}" loads correctly now.`);
    
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
