[![Build Status](https://travis-ci.org/turbonetix/socket.io-event-router.svg?branch=master)](https://travis-ci.org/turbonetix/socket.io-event-router)

(In Alpha)

Router middleware for socket.io

# Installation and Environment Setup

Install node.js (See download and install instructions here: http://nodejs.org/).

Install redis (See download and install instructions http://redis.io/topics/quickstart)

Clone this repository

    > git clone git@github.com:turbonetix/socket.io-event-router.git

cd into the directory and install the dependencies

    > cd bus.io
    > npm install && npm shrinkwrap --dev

# Running Tests

Install coffee-script

    > npm install coffee-script -g

Tests are run using grunt.  You must first globally install the grunt-cli with npm.

    > sudo npm install -g grunt-cli

## Unit Tests

To run the tests, just run grunt

    > grunt spec
