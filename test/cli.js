/*global run*/
'use strict';

var expect = require('chai').expect;
var Rx = require('rx');
var RxNode = require('rx-node');
var rxGlob = require('../lib/rx-glob');
var path = require('path');
var fs = require('fs');
var stream = require('stream');
var scraperCli = require('../cli/core');
var temp = require('temp');
var nodeStatic = require('node-static');
var http = require('http');
var findPort = require('find-port');

rxGlob(path.join(__dirname, 'fixtures/html/*.html'))
    .toArray()
    .subscribe(function(htmlFiles) {
        describe('Scraper CLI', function() {
            describe('fixtures/html/*.html', function() {
                htmlFiles.forEach(function(htmlFile) {
                    var idlFile = path.join(
                        path.resolve(path.dirname(htmlFile), '../idl'),
                        path.basename(htmlFile, path.extname(htmlFile)) + '.idl'
                    );
                    describe(path.basename(htmlFile), function() {
                        var scraped;
                        beforeEach(function() {
                            scraped = scrapeWithArgv([htmlFile, '-o', '-'])
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
            describe('with input type', function() {
                describe('URL', function() {
                    var server;
                    var scraped;
                    beforeEach(function(done) {

                        var file = new nodeStatic.Server('./test');

                        findPort(8090, 8190, function(ports) {
                            server = http.createServer(function(request, response) {
                                request.addListener('end', function() {
                                    //
                                    // Serve files!
                                    //
                                    file.serve(request, response);
                                }).resume();
                            }).listen(ports[0]);
                            scraped = scrapeWithArgv(['http://localhost:' + ports[0] + '/fixtures/html/cssom.html', '-o', '-'])
                                .toArray()
                                .map(function(arr) {
                                    return arr.join("");
                                });
                            done();
                        });
                    });
                    afterEach(function(done) {
                        server.close(done);
                    });
                    it('should complete without errors', function(done) {
                        scraped.subscribe(function() {}, done, done);
                    });
                });
                describe('glob pattern (test/**/cs*.html)', function() {
                    var scraped;
                    beforeEach(function() {
                        scraped = scrapeWithArgv(['test/**/cs*.html', '-o', '-'])
                            .toArray()
                            .map(function(arr) {
                                return arr.join("");
                            });
                    });
                    it('should complete without errors', function(done) {
                        scraped.subscribe(function() {}, done, done);
                    });
                });
                describe('file name (test/fixtures/html/cssom.html)', function() {
                    var scraped;
                    beforeEach(function() {
                        scraped = scrapeWithArgv(['test/fixtures/html/cssom.html', '-o', '-'])
                            .toArray()
                            .map(function(arr) {
                                return arr.join("");
                            });
                    });
                    it('should complete without errors', function(done) {
                        scraped.subscribe(function() {}, done, done);
                    });
                });
                describe('stdin (-)', function() {
                    var scraped;
                    beforeEach(function() {
                        var stdin = new stream.PassThrough();
                        scraped = scrapeStream(stdin)
                            .toArray()
                            .map(function(arr) {
                                return arr.join("");
                            });
                        stdin.end("<html><pre class=\"idl\">interface example { }</pre></html>");
                    });
                    it('should complete without errors', function(done) {
                        scraped.subscribe(function() {}, done, done);
                    });
                });
            });
            describe('with -o <file>', function() {
                var scraped;
                var out;
                beforeEach(function() {
                    out = temp.path({
                        suffix: '.idl'
                    });
                    var stdin = new stream.PassThrough();
                    scraped = scrapeStream(stdin, ['-o', out])
                        .toArray()
                        .map(function(arr) {
                            return arr.join("");
                        });
                    stdin.end("<html><pre class=\"idl\">interface example { }</pre></html>\n");
                });
                afterEach(function() {
                    try {
                        fs.unlinkSync(out);
                    } catch (e) {
                        if (e.code !== 'ENOENT')
                            throw e;
                    }
                });
                it('should create the file', function(done) {
                    scraped.subscribe(function() {}, done, function() {
                        expect(fs.existsSync(out)).to.equal(true);
                        done();
                    });
                });
            });
        });
    }, function(err) {
        throw err;
    }, run);


function scrapeStream(pipeable, extraArgs) {
    if (!extraArgs)
        extraArgs = ['-o', '-'];
    var options = {
        stdin: new stream.PassThrough(),
        stdout: new stream.PassThrough(),
        argv: ['-'].concat(extraArgs),
    };
    options.stdout.setEncoding('utf8');
    pipeable.on('error', function(err) {
        throw err;
    }).pipe(options.stdin);
    scraperCli(options);
    return RxNode.fromReadableStream(options.stdout);
}

function scrapeWithArgv(inputs) {
    var options = {
        stdin: new stream.PassThrough(),
        stdout: new stream.PassThrough(),
        argv: inputs,
    };
    options.stdout.setEncoding('utf8');
    scraperCli(options);
    options.stdin.end();
    return RxNode.fromReadableStream(options.stdout);
}