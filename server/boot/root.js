function migrateModel(database, modelName) {
  return new Promise(function(resolve, reject) {
    database.automigrate(modelName, function(err) {
      if (err) {
        reject(err);
      }

      resolve();
    })
  });
}

module.exports = function(server) {
  // Install a `/` route that returns server status
  var router = server.loopback.Router();
  router.get('/', server.loopback.status());
  server.use(router);

  router.get(`/migrations`, function(req, res) {
    const db = server.dataSources.db;
    const models = [
      'User',
      'AccessToken',
      'ACL',
      'RoleMapping',
      'Role',
      'gamer',
      'message',
      'room',
    ];

    Promise.all(models.map(function(model) {
      return migrateModel(db, model);
    })).then(function() {
      res.send({
        status: 200,
        message: 'Migration Complete',
      });
    });
  });
};
