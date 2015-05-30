'use strict';

var Rx = require('rx');
var glob = require('glob');

var rxGlobArray = Rx.Observable.fromNodeCallback(glob);

var rxGlob = module.exports = function rxGlob() {
    return rxGlobArray
        .apply(null, arguments)
        .flatMap(Rx.Observable.from);
};

rxGlob.hasMagic = glob.hasMagic;