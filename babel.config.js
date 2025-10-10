module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      ["module:react-native-dotenv"],
      "nativewind/babel",
      "react-native-reanimated/plugin",
      [
        "i18next-extract",
        {
          locales: ["fr"],
          outputPath: "localization/{{ns}}.json",
          keyAsDefaultValue: ["fr"],
          keySeparator: null,
          nsSeparator: null,
        },
      ],
    ],
  };
};
