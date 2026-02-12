module.exports = {
  root: true,
  env: { node: true, es2022: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  ignorePatterns: ['node_modules/', 'dist/', 'build/', '*.generated.*', '*.config.*'],
  rules: {
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': ['off', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-require-imports': 'off',
    '@typescript-eslint/no-unused-expressions': 'off',
    'no-empty': 'off',
    'prefer-const': 'off',
    'no-useless-escape': 'off',
    'no-constant-condition': 'off',
    '@typescript-eslint/no-namespace': 'off',
  }
};
