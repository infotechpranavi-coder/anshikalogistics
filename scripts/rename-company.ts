import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const companies = await prisma.company.findMany({
    select: { id: true, name: true, logo: true },
  });
  if (!companies.length) {
    console.log("No company records found.");
    return;
  }
  for (const company of companies) {
    await prisma.company.update({
      where: { id: company.id },
      data: {
        name: "Anshika Logistics",
        logo: "/anishka-logistics-logo.jpeg",
      },
    });
    console.log(
      `Updated "${company.name}" logo=${company.logo ?? "(none)"} -> Anshika Logistics /anishka-logistics-logo.jpeg`
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
