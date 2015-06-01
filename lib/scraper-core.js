'use strict';

var htmlparser = require("htmlparser2");
var util = require('util');
var Writable = require('stream').Writable;

var IdlScraper = module.exports = function IdlScraper(options,cb) {
    if (!(this instanceof IdlScraper))
        return new IdlScraper(options, cb);
    
    if (typeof options === 'function')
    {
        cb = options;
        options = undefined;
    }

    Writable.call(this, {
        decodeStrings: false
    });

    if (typeof cb !== 'function')
        cb = function() {};
    if (!options || typeof options !== 'object')
        options = {};

    var inIDL = false,
        seenIdlIndex = false;

    this.parser = new htmlparser.Parser({
        onopentag: function(tagName, attrs) {
            if (attrs.id === 'idl-index' && !options.withIdlIndex)
                seenIdlIndex = true;
            if (tagName === "pre" && attrs.class) {
                var classList = attrs.class.split(' ');

                if (classList.indexOf("idl") !== -1 &&
                    (classList.indexOf("extract") === -1 || options.withClassExtract) &&
                    (!('data-no-idl' in attrs) || options.withDataNoIdl))
                    inIDL = true;
            }
        },
        ontext: function(text) {
            if (inIDL && !seenIdlIndex)
                cb(null, text);
        },
        onclosetag: function(tagName) {
            if (tagName === "pre") {
                if (inIDL && !seenIdlIndex)
                    cb(null, '\n\n');
                inIDL = false;
            }
        }
    }, {
        decodeEntities: true
    });
};

util.inherits(IdlScraper, require('stream').Writable);

/* eslint no-underscore-dangle: 0 */
IdlScraper.prototype._write = function(chunk, encoding, done) {
    try {
        this.parser.write(chunk);
    } catch (err) {
        done(err);
    }
    done();
};
