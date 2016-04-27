module.exports = function(Message) {
  Message.beforeRemote('create', function(context, user, next) {
    var req = context.req;

    req.body.data.attributes['created-at'] = Date.now();
    req.body.data.relationships.chatter.data = {
      id: req.accessToken.userId,
    };

    if (!req.body.data.relationships.room.data) {
      req.body.data.relationships.room.data = {
        id: 1,
      };
    }

    next();
  });
};
