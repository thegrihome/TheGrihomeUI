import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/cockroachDB/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const builder = await prisma.builder.update({
      where: { id: 'cmgrhmjxe00001yy5i8ex1164' },
      data: {
        description:
          "We are a trusted builder in Hyderabad, India, known for on-time completion and superior quality. We have built over 20 million square feet of happy homes and prime commercial properties. 16 iconic addresses stand testimony to our brand's expertise in building gated communities.",
      },
    })

    res.status(200).json({ message: 'Builder updated successfully', builder })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error updating builder:', error)
    res.status(500).json({ message: 'Failed to update builder' })
  }
}
