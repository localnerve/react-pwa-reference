module.exports = {
  plugins: [
    'lodash'
  ],
  presets: [
    '@babel/preset-env',
    '@babel/preset-react'
  ],
  ignore: [
    'assets/**',
    'dist/**',
    'output/**',
    'reports/**',
    'tmp/**'
  ],
  env: {
    cover: {
      plugins: [
        [
          'istanbul', {
            exclude: [
              '!**/node_modules/**',
              '**/tests/**'
            ]
          }
        ]
      ]
    }
  }
};
