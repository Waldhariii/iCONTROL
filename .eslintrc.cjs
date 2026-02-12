module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    '*.generated.*',
    '*.config.js',
    '*.config.mjs',
    '*.config.cjs',
  ],
  rules: {
    // Désactiver temporairement les règles problématiques
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-empty': 'warn',
    'prefer-const': 'warn',
    'no-useless-escape': 'warn',
    'no-constant-condition': 'warn',
    '@typescript-eslint/no-namespace': 'off',
  },
};
