module.exports = config => {
  return {
    ...config,
    template: 'react',
    outputDir: '.dist',
    ignore: /^\./,
    skipTransform: /\.html$|\.toml$/
  }
}
