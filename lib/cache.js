'use strict';

const Cacheman = require('cacheman');

const cache = new Cacheman({ ttl: process.env.CACHE_TTL || 1440 });

/**
 * @param {String} id
 * @return {Promise}
 */
function get(id) {
  return cache.get(id);
}

/**
 * @param {String} id
 * @param {String} data
 * @return {Promise}
 */
function set(id, data) {
  return cache.set(id, data);
}

module.exports = {
  get,
  set,
};
