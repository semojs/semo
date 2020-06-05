module.exports = {
  extends: ['standard', 'plugin:@typescript-eslint/recommended'],
  plugins: ['standard', 'promise', '@typescript-eslint'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: './'
  },
  rules: {
    '@typescript-eslint/no-use-before-define': 'warn',
    '@typescript-eslint/camelcase': ['error', { properties: 'never' }],
    '@typescript-eslint/indent': ['error', 2],
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/interface-name-prefix': 'never'
  },
  globals: {
    process: true
  }
}
