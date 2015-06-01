/*global run*/
'use strict';

var expect = require('chai').expect;
var Rx = require('rx');
var RxNode = require('rx-node');
var rxGlob = require('../lib/rx-glob');
var path = require('path');
var fs = require('fs');
var IdlScraper = require('../lib/scraper-core');

rxGlob(path.join(__dirname, 'fixtures/html/*.html'))
    .toArray()
    .subscribe(function(htmlFiles) {
        describe('scraper-core', function() {
            describe('fixtures/html/*.html', function() {
                htmlFiles.forEach(function(htmlFile) {
                    var idlFile = path.join(
                        path.resolve(path.dirname(htmlFile), '../idl'),
                        path.basename(htmlFile, path.extname(htmlFile)) + '.idl'
                    );
                    var optionsFile = path.join(
                        path.resolve(path.dirname(htmlFile), '../options'),
                        path.basename(htmlFile, path.extname(htmlFile)) + '.json'
                    );
                    var scrapeOptions = null;
                    if (fs.existsSync(optionsFile))
                        scrapeOptions = JSON.parse(fs.readFileSync(optionsFile))['scraper-core'];
                    describe(path.basename(htmlFile) + (scrapeOptions ? (' + options/' + path.basename(optionsFile)) : ''), function() {
                        var scraped;
                        beforeEach(function() {
                            scraped = scrapeStream(fs.createReadStream(htmlFile, {
                                encoding: 'utf8'
                            }), scrapeOptions)
                                .toArray()
                                .map(function(arr) {
                                    return arr.join("");
                                });
                        });
                        if (fs.existsSync(idlFile)) {
                            it('should match ' + path.basename(idlFile), function(done) {
                                var truth = RxNode.fromReadableStream(fs.createReadStream(idlFile, {
                                        encoding: 'utf8'
                                    }))
                                    .toArray()
                                    .map(function(arr) {
                                        return arr.join("");
                                    });
                                Rx.Observable.forkJoin(scraped, truth)
                                    .forEach(function(both) {
                                        var scrapedAll = both[0];
                                        var truthAll = both[1];
                                        expect(scrapedAll).to.be.equal(truthAll);
                                    }, done, done);
                            });
                        } else
                            it('should complete without errors', function(done) {
                                scraped.subscribe(function() {}, done, done);
                            });
                    });
                });
            });
        });
    }, function(err) {
        throw err;
    }, run);


function scrapeStream(pipeable, scrapeOptions) {
    return Rx.Observable.create(function(observer) {
        var scraper = new IdlScraper(scrapeOptions, function(err, scrapedBlock) {
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
}