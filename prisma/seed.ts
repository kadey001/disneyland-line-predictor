import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Mock wait time data for popular Disneyland rides
const mockRideData = [
    {
        rideId: 326,
        rideName: "Space Mountain",
        isOpen: true,
        waitTime: 45,
        snapshotTime: new Date('2025-08-22T10:00:00Z')
    },
    {
        rideId: 326,
        rideName: "Space Mountain",
        isOpen: true,
        waitTime: 50,
        snapshotTime: new Date('2025-08-22T11:00:00Z')
    },
    {
        rideId: 326,
        rideName: "Space Mountain",
        isOpen: true,
        waitTime: 35,
        snapshotTime: new Date('2025-08-22T12:00:00Z')
    },
    {
        rideId: 275,
        rideName: "Indiana Jones Adventure",
        isOpen: true,
        waitTime: 60,
        snapshotTime: new Date('2025-08-22T10:00:00Z')
    },
    {
        rideId: 275,
        rideName: "Indiana Jones Adventure",
        isOpen: true,
        waitTime: 65,
        snapshotTime: new Date('2025-08-22T11:00:00Z')
    },
    {
        rideId: 275,
        rideName: "Indiana Jones Adventure",
        isOpen: true,
        waitTime: 55,
        snapshotTime: new Date('2025-08-22T12:00:00Z')
    },
    {
        rideId: 288,
        rideName: "Big Thunder Mountain Railroad",
        isOpen: true,
        waitTime: 30,
        snapshotTime: new Date('2025-08-22T10:00:00Z')
    },
    {
        rideId: 288,
        rideName: "Big Thunder Mountain Railroad",
        isOpen: true,
        waitTime: 35,
        snapshotTime: new Date('2025-08-22T11:00:00Z')
    },
    {
        rideId: 288,
        rideName: "Big Thunder Mountain Railroad",
        isOpen: true,
        waitTime: 25,
        snapshotTime: new Date('2025-08-22T12:00:00Z')
    },
    {
        rideId: 277,
        rideName: "Matterhorn Bobsleds",
        isOpen: true,
        waitTime: 40,
        snapshotTime: new Date('2025-08-22T10:00:00Z')
    },
    {
        rideId: 277,
        rideName: "Matterhorn Bobsleds",
        isOpen: true,
        waitTime: 45,
        snapshotTime: new Date('2025-08-22T11:00:00Z')
    },
    {
        rideId: 277,
        rideName: "Matterhorn Bobsleds",
        isOpen: true,
        waitTime: 30,
        snapshotTime: new Date('2025-08-22T12:00:00Z')
    },
    {
        rideId: 279,
        rideName: "Pirates of the Caribbean",
        isOpen: true,
        waitTime: 25,
        snapshotTime: new Date('2025-08-22T10:00:00Z')
    },
    {
        rideId: 279,
        rideName: "Pirates of the Caribbean",
        isOpen: true,
        waitTime: 30,
        snapshotTime: new Date('2025-08-22T11:00:00Z')
    },
    {
        rideId: 279,
        rideName: "Pirates of the Caribbean",
        isOpen: true,
        waitTime: 20,
        snapshotTime: new Date('2025-08-22T12:00:00Z')
    },
    {
        rideId: 278,
        rideName: "Haunted Mansion",
        isOpen: true,
        waitTime: 35,
        snapshotTime: new Date('2025-08-22T10:00:00Z')
    },
    {
        rideId: 278,
        rideName: "Haunted Mansion",
        isOpen: true,
        waitTime: 40,
        snapshotTime: new Date('2025-08-22T11:00:00Z')
    },
    {
        rideId: 278,
        rideName: "Haunted Mansion",
        isOpen: true,
        waitTime: 30,
        snapshotTime: new Date('2025-08-22T12:00:00Z')
    },
    {
        rideId: 280,
        rideName: "Jungle Cruise",
        isOpen: true,
        waitTime: 15,
        snapshotTime: new Date('2025-08-22T10:00:00Z')
    },
    {
        rideId: 280,
        rideName: "Jungle Cruise",
        isOpen: true,
        waitTime: 20,
        snapshotTime: new Date('2025-08-22T11:00:00Z')
    },
    {
        rideId: 280,
        rideName: "Jungle Cruise",
        isOpen: true,
        waitTime: 10,
        snapshotTime: new Date('2025-08-22T12:00:00Z')
    },
    {
        rideId: 296,
        rideName: "Star Wars: Rise of the Resistance",
        isOpen: true,
        waitTime: 120,
        snapshotTime: new Date('2025-08-22T10:00:00Z')
    },
    {
        rideId: 296,
        rideName: "Star Wars: Rise of the Resistance",
        isOpen: true,
        waitTime: 135,
        snapshotTime: new Date('2025-08-22T11:00:00Z')
    },
    {
        rideId: 296,
        rideName: "Star Wars: Rise of the Resistance",
        isOpen: true,
        waitTime: 110,
        snapshotTime: new Date('2025-08-22T12:00:00Z')
    },
    {
        rideId: 14326,
        rideName: "Millennium Falcon: Smugglers Run",
        isOpen: true,
        waitTime: 75,
        snapshotTime: new Date('2025-08-22T10:00:00Z')
    },
    {
        rideId: 14326,
        rideName: "Millennium Falcon: Smugglers Run",
        isOpen: true,
        waitTime: 80,
        snapshotTime: new Date('2025-08-22T11:00:00Z')
    },
    {
        rideId: 14326,
        rideName: "Millennium Falcon: Smugglers Run",
        isOpen: true,
        waitTime: 65,
        snapshotTime: new Date('2025-08-22T12:00:00Z')
    }
]

async function main() {
    console.log('Start seeding...')

    // Clear existing data
    await prisma.rideWaitTimeSnapshot.deleteMany({})
    console.log('Cleared existing data')

    // Insert mock data
    for (const data of mockRideData) {
        const snapshot = await prisma.rideWaitTimeSnapshot.create({
            data: data
        })
        console.log(`Created snapshot with id: ${snapshot.id} for ${snapshot.rideName}`)
    }

    console.log('Seeding finished.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
