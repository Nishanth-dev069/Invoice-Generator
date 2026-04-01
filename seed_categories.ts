import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const defaultCategories = [
    "Wedding Cards", "Business Cards", "Brochures", "Flyers", "Visiting Cards",
    "Pamphlets", "Booklets", "Envelopes", "Letterheads", "Banners",
    "Stickers", "ID Cards", "Calendars", "Invitation Cards", "Posters"
  ]

  console.log("Seeding default invoice categories...")

  for (const name of defaultCategories) {
    await prisma.invoiceCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    })
  }

  console.log("Categories seeded successfully.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
