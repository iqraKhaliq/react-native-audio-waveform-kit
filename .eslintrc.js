module.exports = {
  root: true,
  extends: '@react-native',
  plugins: ['import'],
  settings: {
    'import/resolver': {
      'babel-module': {
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      },
    },
  },
  rules: {
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          ['parent', 'sibling', 'index'],
        ],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
        pathGroups: [
          {
            pattern: 'react',
            group: 'external',
            position: 'before',
          },
          {
            pattern: 'react-native',
            group: 'external',
            position: 'before',
          },
          {
            pattern: '@**',
            group: 'internal',
            position: 'after',
          },
        ],
        pathGroupsExcludedImportTypes: ['react', 'react-native'],
      },
    ],
    'import/no-unresolved': 'error',
    'import/no-duplicates': 'error',
    'import/no-unused-modules': 'off', // Can be enabled if needed

    // React rules
    'react/react-in-jsx-scope': 'off',
    'react/display-name': 'off',

    // React Native rules
    'react-native/sort-styles': 'off',

    // General rules
    'no-unsafe-optional-chaining': 'off',
    'no-useless-escape': 'off',
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        'import/no-unresolved': [
          'error',
          {
            ignore: ['^@'],
          },
        ],
      },
    },
  ],
};
