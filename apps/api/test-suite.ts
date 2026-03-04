import { testSuiteService } from './src/modules/test-suite/testSuite.service';

async function main() {
  try {
    const suite = await testSuiteService.createTestSuite({
      name: "Debug Suite",
      description: "Testing Prisma Error",
      projectId: "4bb5bff1-8d0d-44b5-a519-2251b3c17c21"
    });
    console.log("SUCCESS:", suite);
  } catch (error) {
    console.error("PRISMA ERROR DETECTED:");
    console.error(error);
  }
}

main();
