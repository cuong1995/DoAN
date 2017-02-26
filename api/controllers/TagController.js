var checkit = require('checkit');

module.exports = {

  getByName: function (req, res) {
    var [err, params] = new checkit({
      tag_name: ['required', 'string'],
    }).validateSync(req.allParams());

    if (err) {
      return res.badRequest(err.toString());
    }

    TagService.getOneByName(params.tag_name, function(err, tag) {
      if (err) {
        return res.serverError(err.toString());
      }
      if (!tag) {
        return res.notFound('Cannot find tag name=' + params.tag_name);
      }
      res.ok({data: tag});
    });
  },

  search: function (req, res) {
    var [err, params] = new checkit({
      q: ['required', 'string'],
    }).validateSync(req.allParams());

    if (err) {
      return res.badRequest(err.toString());
    }

    TagService.search(params.q, function(err, tag) {
      if (err) {
        return res.serverError(err.toString());
      }
      if (!tag) {
        return res.ok([]);
      }
      res.ok({data: tag});
    });
  },

  getRecentMedias: function(req, res) {
    var rule = _.assign({tag_name: ['required', 'string']}, PaginationService.getRule());
    var params = req.allParams();
    params.before_id = params.before_tag_id;
    params.after_id  = params.after_tag_id;
    var [err, params] = new checkit(rule).validateSync(params);
    if (err) {
      return res.badRequest(err.toString());
    }

    async.auto({
      data: function(next) {
        TagService.getRecentMediasByTag(params.tag_name, PaginationService.parse(params), next);
      },
      pagination: ['data', function (ret, next) {
        PaginationService.genMetaData(ret.data.tags, next);
      }],
    }, function(err, ret) {
      if (err) {
        return res.serverError(err.toString());
      }
      res.ok({ data: ret.data.medias, pagination: ret.pagination });
    });
  },
};
