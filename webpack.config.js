const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const HtmlWebPackPlugin = require("html-webpack-plugin");
const path = require("path");
const prefixer = require("postcss-prefix-selector");
const autoprefixer = require("autoprefixer");
const { DefinePlugin } = require("webpack");
const rootClass = "vidoomy-ad-wrapper-" + Math.floor(Math.random() * 1000000);

module.exports = {  
  output: {
    path: path.resolve(__dirname, "../dist"),
    filename: "[name].js",
    library: "vidoomy"
  },
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx", ".json"]
  },
  module: {
    rules: [
      {
        test: /\.(js|ts)x?$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      },
      /*{
        test: /.js$/,
        include: new RegExp(`\\${path.sep}prebid\.js`),
        use: {
          loader: "babel-loader",
          // presets and plugins for Prebid.js must be manually specified separate from your other babel rule.
          // this can be accomplished by requiring prebid's .babelrc.js file (requires Babel 7 and Node v8.9.0+)
          options: require("prebid.js/.babelrc.js")
        }
      },*/
      {
        test: /\.html$/,
        use: [
          {
            loader: "html-loader",
            options: { minimize: true }
          }
        ]
      },
      {
        test: [/.css$|.scss$/],
        use: [
          {
            loader: "style-loader",
            options: {
              insert: function insertAtTop(element) {
                var parent = top.document.querySelector("head");
                // eslint-disable-next-line no-underscore-dangle
                var lastInsertedElement =
                  window._lastElementInsertedByStyleLoader;

                if (!lastInsertedElement) {
                  parent.insertBefore(element, parent.firstChild);
                } else if (lastInsertedElement.nextSibling) {
                  parent.insertBefore(element, lastInsertedElement.nextSibling);
                } else {
                  parent.appendChild(element);
                }

                // eslint-disable-next-line no-underscore-dangle
                window._lastElementInsertedByStyleLoader = element;
              }
            }
          },
          "css-loader",
          {
            loader: require.resolve("postcss-loader"),
            options: {
              plugins: () => [
                prefixer({
                  prefix: "." + rootClass
                }),
                autoprefixer()
              ]
            }
          },
          "sass-loader"
        ]
      },
      {
        test: /\.(woff|woff2|ttf|otf|eot)$/,
        loader: "file-loader",
        options: {
          outputPath: "css/",
          publicPath: url => `../css/${url}`
        }
      }
    ]
  },
  plugins: [
    new HtmlWebPackPlugin({
      template: "./src/index.html",
      filename: "./index.html"
    }),
    /* new CopyPlugin([
      { from: path.resolve(__dirname, "../", "assets"), to: "assets" }
    ]),*/
    new CleanWebpackPlugin(),
    new DefinePlugin({
      __ROOT_CLASS__: JSON.stringify(rootClass)
    })
  ]
  }