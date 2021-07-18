require('ts-node').register({
    projectSearchDir: __dirname
});
const { UnpkgPlugin } = require('./UnpkgPluginImpl');

module.exports = function (PluginHost) {
    var app = PluginHost.owner;

    // app.options.addDeclaration({name: 'sourcefile-url-map'});
    // app.options.addDeclaration({name: 'sourcefile-url-prefix'});

    app.converter.addComponent('unpkg-plugin', UnpkgPlugin);
}