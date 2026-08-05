/**
 * Testes unitários (`*.spec.ts`, colocados ao lado do código).
 * Os e2e têm config própria em `test/jest-e2e.json`.
 */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  testEnvironment: 'node',
};
