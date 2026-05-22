import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  console.log('Database URL:', process.env.DATABASE_URL);
  try {
    const webSlingersId = '2295351d-ce6b-4c04-92d5-5b416372c5b5';
    
    // Get latest 10 records
    const records = await prisma.rideDataHistory.findMany({
      where: {
        rideId: webSlingersId
      },
      orderBy: {
        lastUpdated: 'desc'
      },
      take: 10
    });

    console.log(`Found ${records.length} records for WEB SLINGERS:`);
    records.forEach(r => {
      console.log({
        id: r.id.toString(),
        name: r.name,
        standbyWaitTime: r.standbyWaitTime,
        status: r.status,
        lastUpdated: r.lastUpdated,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt
      });
    });

  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
