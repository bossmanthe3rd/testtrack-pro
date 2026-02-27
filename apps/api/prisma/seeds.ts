/// <reference types="node" />
import { PrismaClient, Role, Priority, Severity, TestCaseStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding...');

    // 1. Hash a generic password for our seed users
    // The requirements document specifies bcrypt with a cost factor of 12
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash('Test@1234', saltRounds);

    // 2. Create a Tester User
    const tester = await prisma.user.upsert({
        where: { email: 'jane.tester@company.com' },
        update: {},
        create: {
            name: 'Jane Tester',
            email: 'jane.tester@company.com',
            password: hashedPassword,
            role: Role.TESTER,
        },
    });
    console.log(`✅ Created Tester: ${tester.name}`);

    // 3. Create a Developer User
    const developer = await prisma.user.upsert({
        where: { email: 'mike.developer@company.com' },
        update: {},
        create: {
            name: 'Mike Developer',
            email: 'mike.developer@company.com',
            password: hashedPassword,
            role: Role.DEVELOPER,
        },
    });
    console.log(`✅ Created Developer: ${developer.name}`);

    // 4. Create a Project
    // 4. Create or Find a Project
    // Since Project 'name' isn't explicitly marked @unique in our schema, 
    // we use findFirst instead of upsert.
    let project = await prisma.project.findFirst({
        where: { name: 'TestTrack Pro Web Portal' },
    });

    if (!project) {
        project = await prisma.project.create({
            data: {
                name: 'TestTrack Pro Web Portal',
                description: 'The main web application project for tracking tests and bugs.',
            },
        });
        console.log(`✅ Created Project: ${project.name}`);
    } else {
        console.log(`⏩ Project already exists: ${project.name}`);
    }

    // 5. Create a Sample Test Case with nested Test Steps (Using Upsert!)
    const testCase = await prisma.testCase.upsert({
        where: { testCaseId: 'TC-2024-00001' },
        update: {}, // If it exists, do nothing
        create: {
            testCaseId: 'TC-2024-00001',
            title: 'Verify user login with valid credentials',
            description: 'This test verifies that a registered user can successfully log into the system using valid email and password combination',
            module: 'Authentication',
            type: 'Functional',
            priority: Priority.P1,
            severity: Severity.BLOCKER,
            status: TestCaseStatus.APPROVED,
            createdById: tester.id,
            projectId: project.id,

            steps: {
                create: [
                    {
                        stepNumber: 1,
                        action: 'Navigate to login page at /login',
                        expectedResult: 'Login page loads with email and password fields visible',
                    },
                    {
                        stepNumber: 2,
                        action: 'Enter valid email and password, then click Sign In',
                        testData: 'Email: jane.tester@company.com',
                        expectedResult: 'User is authenticated and redirected to dashboard',
                    },
                ],
            },
        },
    });
    console.log(`✅ Test Case secured: ${testCase.testCaseId}`);
    console.log(`✅ Created Test Case: ${testCase.testCaseId} with 2 steps`);

    console.log('🎉 Seeding finished successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });