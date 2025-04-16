module.exports = {
  extends: ['standard', 'plugin:@typescript-eslint/recommended'],
  plugins: ['standard', 'promise', '@typescript-eslint'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: './',
  },
  rules: {
    '@typescript-eslint/no-use-before-define': 'warn',
    '@typescript-eslint/camelcase': 'off',
    '@typescript-eslint/indent': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-require-imports': 'off',
    '@typescript-eslint/no-unsafe-function-type': 'off',
    '@typescript-eslint/no-unused-expressions': 'off',
    'no-case-declarations': 'off',
    'no-useless-escape': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
  },
  globals: {
    process: true,
  },
}
