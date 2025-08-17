// i18next-scanner.config.js
module.exports = {
    input: [
      'src/**/*.{js,jsx,ts,tsx}',
    ],
    output: './',
    options: {
      debug: true,
      func: {
        list: ['i18n.t'],
        extensions: ['.js', '.jsx']
      },
      lngs: ['fr'],
      defaultNs: 'translation',
      defaultValue: '__STRING_NOT_TRANSLATED__',
      resource: {
        savePath: 'locales/{{lng}}/{{ns}}.json'
      }
    }
  };
  