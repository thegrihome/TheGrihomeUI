const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

async function main() {
  const result = await prisma.builder.update({
    where: { id: 'cmgrhmjxe00001yy5i8ex1164' },
    data: {
      description:
        "We are a trusted builder in Hyderabad, India, known for on-time completion and superior quality. We have built over 20 million square feet of happy homes and prime commercial properties. 16 iconic addresses stand testimony to our brand's expertise in building gated communities.",
    },
  })
  console.log('Updated builder:', result.name)
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
