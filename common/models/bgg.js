require('isomorphic-fetch');

var options = {
  timeout: 10000, // timeout of 10s (5s is the default)

  // see https://github.com/cujojs/rest/blob/master/docs/interceptors.md#module-rest/interceptor/retry
  retry: {
    initial: 100,
    multiplier: 2,
    max: 15e3,
  },
};

var bgg = require('bgg')(options);

function search(query) {
  return bgg('search', {
    query
  });
}

function formatOne(game) {
  return {
    type: 'bgg',
    id: game.gameId,
    attributes: {
      name: game.name,
      description: game.description,
      image: game.image,
      'min-players': game['min-players'],
      'max-players': game['max-players'],
      'year-published': game['year-published'],
      mechanics: game.mechanics,
      designers: game.designers,
      publishers: game.publishers,
      artists: game.artists,
    },
  };
}

function findOne(id, cb) {
  return fetch(`https://bgg-json.azurewebsites.net/thing/${id}`)
    .then(x => x.json())
    .then((data) => {
      cb(null, formatOne(data));
    });
};

module.exports = function(Bgg) {
  Bgg.getOne = function(id, cb) {
    return findOne(id, cb);
  };

  Bgg.findAll = function(req, cb) {
    if (req.query.first) {
      return search(req.query.query).then((xml) => {
        return xml.items.item[0].id;
      }).then((id) => {
        return findOne(id, cb);
      });
    }

    search(req.query.query).then(xml => {
      const data = xml.items.item.map((game) => {
        const attributes = {};

        if (game.name) {
          attributes.name = game.name.value;
        }

        if (game.yearpublished) {
          attributes.year = game.yearpublished.value;
        }

        return {
          type: game.type,
          id: game.id,
          attributes,
        };
      }).filter(game => game.type === 'boardgame');

      cb(null, {
        data
      });
    });
  };

  Bgg.remoteMethod(
    'findAll', {
      http: { path: '/', verb: 'get' },
      accepts: [
        { arg: 'req', type: 'object', 'http': { source: 'req' } },
      ],
      returns: { type: 'object', root: true }
    }
  );

  Bgg.remoteMethod(
    'getOne', {
      http: {path: '/:id', verb: 'get'},
      accepts: [
        {arg: 'id', type: 'number', required: true}
      ],
      returns: { type: 'object', root: true }
    }
  );
};
