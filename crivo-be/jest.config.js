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
  // O código importa por `src/...` (baseUrl do tsconfig); sem o mapa o Jest
  // resolve esses imports a partir de `src/` e falha em qualquer teste que
  // use um serviço de verdade (com import de valor), não só type-only.
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/$1',
  },
};
