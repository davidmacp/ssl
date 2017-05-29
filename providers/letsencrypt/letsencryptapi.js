'use strict'

const fetch = require('node-fetch')
const util = require('../../lib/util')

class LetsEncryptAPI {

  constructor () {}

  updateAPIList () {
    return this.requestDirectories()
      .then(dirs => this.directories = dirs)
  }

  register () {
    return this.generateSignedRequest({
      resource: "new-reg",
      contact: [`mailto:${this.opts.email}`]
    }).then(body => {
      // console.log(body)
      return fetch(this.directories.registration, {
            method: 'POST',
            body: JSON.stringify(body),
          })
          .then(resp => resp.json())
    })
  }

  // fetchCert (body) {
    // return this.generateSignedRequest({
    //   resource: "new-reg"
    // }).then(body => {
    //   return fetch(this.directories.cert, {
    //         method: 'POST',
    //         body: JSON.stringify(body),
    //       })
    //       .then(resp => resp.json())
    // })
  // }


  generateSignedRequest (payload) {
    let body = {}
    return this.fetchNonce()
      .then(nonce => {

        const key = util.rsa()
        // console.log('key size', key.getKeySize())
        // console.log('max message size', key.getMaxMessageSize())
        // console.log(key.exportKey('components'))
        const payload_buffer = util.toBuffer(JSON.stringify(payload))

        body.payload = util.b64enc(payload_buffer)

        // Header
        body.header = this.generateHeader(key)

        const bodyString = JSON.stringify(Object.assign({}, body.header, {nonce: nonce}))
        body.protected = util.b64enc(util.toBuffer(bodyString))

        const buffer = util.toBuffer(`${body.protected}.${body.payload}`)
        console.log(buffer.length)
        const signature = key.sign(buffer)

        body.signature = util.b64enc(signature)

        return body
      })
  }

  generateHeader (key) {
    const buffer_e = util
      .toBinaryString(key.exportKey('components').e)
    const buffer_n = util
      .toBinaryString(key.exportKey('components').n)

    return {
      alg: 'RS256',
      jwk: {
        kty: 'RSA',
        e: util.b64enc(
          buffer_e
        ),
        n: util.b64enc(
          buffer_n
        ),
      }
    }
  }

  /**
   * Get Directories.
   * @return {Object} List of API directories.
   */
  get directories () {
    return this._directories
  }

  /**
   * Set Directories
   * @param  {Object} dirs API directories.
   */
  set directories (dirs) {
    this._directories = {
      keyChange: dirs['key-change'],
      auth: dirs['new-authz'],
      cert: dirs['new-cert'],
      registration: dirs['new-reg'],
      revoke: dirs['revoke-cert']
    }
  }

  /**
   * Fetch Nonce
   * With a HEAD request, fetch a single use replay-nonce for signing the request.
   * @return {String} replay-nonce
   */
  fetchNonce () {
    return fetch(this.dirUrl, {
      method: 'HEAD'
    })
      .then(res => res.headers.get('replay-nonce'))
  }

  /**
   * Fetch directories
   * @return {[type]} [description]
   */
  requestDirectories () {
    return fetch(this.dirUrl)
      .then(res => res.json())
  }



}

module.exports = LetsEncryptAPI