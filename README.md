# Oligrapher 2 Stand-alone backend

This application provides a minimalistic backend for the storage and
management of Oligrapher 2 network storystelling pieces. It is
intended as a minimalistic server which stores a packet of JSON with
very little introspection, but manage titles and authorized users.

## Installation

```bash
$ npm install
$ bower install
```

The following environment variables are required to be set:

* SECRET_KEY with a random string. 
* FACEBOOK_APP_ID and FACEBOOK_APP_SECRET from https://developers.facebook.com/apps/

Run in development via:

```bash
$ node src/server.js
```

## API

* /auth/facebook - begin oauth authorization
* /auth/logout - end a user session
* /auth/session - get the current session
* /api/maps - list available maps
