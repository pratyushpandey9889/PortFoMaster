/** @type {import('jest').Config} */
const config = {
  preset: "ts-jest",
  testEnvironment: "node",
  // Only run files in src (not Next.js app/ routes which need a different setup)
  testMatch: ["**/src/**/*.test.ts", "**/src/**/*.test.tsx"],
  moduleNameMapper: {
    // Support the @/* path alias defined in tsconfig
    "^@/(.*)$": "<rootDir>/$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          // ts-jest needs CommonJS output to run in Jest
          module: "commonjs",
          // Relax strict settings that don't affect pure logic tests
          isolatedModules: true,
        },
      },
    ],
  },
};

module.exports = config;
