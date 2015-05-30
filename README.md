# webidl-scraper [![Build Status](https://travis-ci.org/motiz88/webidl-scraper.png?branch=master)](https://travis-ci.org/motiz88/webidl-scraper)

Scrape IDL definitions from Web standard specs

## Installation

Download node at [nodejs.org](http://nodejs.org) and install it, if you haven't already.

```sh
npm install -g webidl-scraper
```

## Usage

```
  webidl-scraper [options] <inputs: file | URL | "-" ...> (use - for stdin)

  Options:

    -h, --help                output usage information
    -V, --version             output the version number
    -o, --output-file <file>  output the scraped IDL to <file> (use - for stdout, the default)
```

## Examples
Scrape a Web page for IDL fragments:
```sh
webidl-scraper https://html.spec.whatwg.org/
# Output to stdout

webidl-scraper http://dev.w3.org/csswg/cssom/ -o cssom.idl
# Save to cssom.idl

curl -sL http://dev.w3.org/csswg/cssom/ | webidl-scraper - > cssom.idl 
# Use curl for HTTP and redirect stdout to cssom.idl
```
Scrape an HTML file for IDL fragments:
```
webidl-scraper html5-spec.html -o html5-spec.idl
```
## Scraping algorithm
1. Get the contents of `<pre class="idl" />`, tags, excluding `class="idl extract"` ([reference](http://stackoverflow.com/a/7644380)).
2. If the document as an _IDL Index_ section ([example](http://dev.w3.org/csswg/cssom/#idl-index)) - marked by an element with `id="idl-index"` - ignore IDL fragments that follow, on the assumption that they will contain no new IDL.

## Tests

```sh
npm install
npm test
```
```

> webidl-scraper@0.0.1 test C:\Users\Moti Z\Documents\GitHub\webidl-scraper
> mocha
  Scraper CLI
    fixtures/html/*.html
      cssom.html
        √ should match cssom.idl (101ms)
      html5.html
        √ should match html5.idl (1016ms)
      noidl.html
        √ should match noidl.idl
    with input type
      URL
        √ should complete without errors
      glob pattern (test/**/cs*.html)
        √ should complete without errors
      file name (test/fixtures/html/cssom.html)
        √ should complete without errors
      stdin (-)
        √ should complete without errors
    with -o <file>
      √ should create the file
  scraper-core
    fixtures/html/*.html
      cssom.html
        √ should match cssom.idl
      html5.html
        √ should match html5.idl (819ms)
      noidl.html
        √ should match noidl.idl
  11 passing (2s)

```

## Dependencies

- [commander](https://github.com/tj/commander.js): the complete solution for node.js command-line programs
- [glob](https://github.com/isaacs/node-glob): a little globber
- [htmlparser2](https://github.com/fb55/htmlparser2): Fast &amp; forgiving HTML/XML/RSS parser
- [request](https://github.com/git+https:/): Simplified HTTP request client.
- [rx](https://github.com/Reactive-Extensions/RxJS): Library for composing asynchronous and event-based operations in JavaScript

## Dev Dependencies

- [chai](https://github.com/chaijs/chai): BDD/TDD assertion library for node.js and the browser. Test framework agnostic.
- [find-port](https://github.com/kessler/find-port): find an unused port in your localhost
- [mocha](https://github.com/mochajs/mocha): simple, flexible, fun test framework
- [node-static](https://github.com/cloudhead/node-static): simple, compliant file streaming module for node
- [rx-node](https://github.com/Reactive-Extensions/rx-node): RxJS Bindings for Node.js and io.js
- [temp](https://github.com/bruce/node-temp): Temporary files and directories


## License

MIT

