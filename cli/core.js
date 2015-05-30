'use strict';

var Command = require('commander').Command;
var Rx = require('rx');
var rxGlob = require('../lib/rx-glob');
var stream = require('stream');
var request = require('request');
var IdlScraper = require('../lib/scraper-core');
var url = require('url');
var fs = require('fs');

module.exports = function scraperCli(options) {
    if (!options)
        options = {};
    if (options.length)
        options = {
            argv: options
        };
    if (!options.argv)
        options.argv = process.argv;
    else
        options.argv = ['', ''].concat(options.argv);

    if (!options.stdout)
        options.stdout = process.stdout;
    if (!options.stdin)
        options.stdin = process.stdin;

    var inputs = [];
    var program = new Command('webidl-scraper');
    program
        .version(require('../package.json').version)
        .description('Scrape IDL definitions from Web standard specs.')
        .usage('[options] <inputs: file | URL | "-" ...> (use - for stdin)')
        .arguments('<inputs...>')
        .option('-o, --output-file <file>', 'output the scraped IDL to <file> (use - for stdout, the default)', '-')
        .action(function(inputArgs) {
            inputs = inputArgs;
        })
        .parse(options.argv);

    if (program.outputFile && program.outputFile.length && program.outputFile !== '-' && !inputs.length)
        inputs = ['-'];

    if (!inputs.length) {
        program.outputHelp();
        return;
    }

    var outputStream =
        program.outputFile === '-' ?
        options.stdout :
        fs.createWriteStream(program.outputFile);

    Rx.Observable.from(inputs)
        .concatMap(function(input) {
            if (input === '-')
                return Rx.Observable.of(options.stdin);
            else {
                var inputUrl = url.parse(input);
                if (inputUrl.protocol === 'http:' || inputUrl.protocol === 'https:') {
                    var buf = new stream.PassThrough();
                    request(input).pipe(buf);
                    return Rx.Observable.of(buf);
                }
            }
            return (rxGlob.hasMagic(input) ? rxGlob(input) : Rx.Observable.of(input))
                .map(fs.createReadStream);
        })
        .concatMap(function(pipeable) {
            return Rx.Observable.create(function(observer) {
                var scraper = new IdlScraper(function(err, scrapedBlock) {
                    if (err)
                        observer.onError(err);
                    else
                        observer.onNext(scrapedBlock);
                });

                pipeable.on('error', function(err) {
                    observer.onError(err);
                }).pipe(scraper);
                scraper.on('finish', function() {
                    observer.onCompleted();
                });
            });
        })
        .forEach(function(idlChunk) {
            outputStream.write(idlChunk);
        }, function(err) {
            console.error(err);
            throw err;
        }, function() {
            /* eslint no-underscore-dangle: 0 */
            if (!outputStream._isStdio)
                outputStream.end();
            if (options.stdout && options.stdout !== outputStream && !options.stdout._isStdio &&
                typeof options.stdout.end === 'function')
                options.stdout.end();
        });
};