module.exports = {

  DEFAULT_PAGINATION_COUNT: 20,

  _paginate: function(query, pagination) {
    if (!pagination) pagination = {};
    var id_field = pagination.id_field;

    if (!(id_field in query['where'])) {
      if (pagination.before_id) {
        query['where'][id_field] = { '<': pagination.before_id };
      } else if (pagination.after_id) {
        query['where'][id_field] = { '>' : pagination.after_id };
        query['sort'] = id_field + ' ASC';
      }
    }

    if (!('limit' in query)) query.limit = pagination.count || PaginationService.DEFAULT_PAGINATION_COUNT;
    if (!('sort' in query)) query['sort'] = id_field + ' DESC';

    return query;
  },

  exec: function(query, pagination, callback) {
    if (query._criteria) {
      query._criteria = PaginationService._paginate(query._criteria, pagination);
    }

    query.exec(function (err, result){
      if (err) return callback(err);
      callback(null, query['sort'] === (pagination.id_field + ' ASC') ? _.reverse(result) : result);
    });
  },

  getRule: function() {
    return {
      count     : 'naturalNonZero',
      before_id : 'string',
      after_id  : 'string',
      id_field  : 'string',
    };
  },

  parse: function(q) {
    var pagination = _.pick(q, ['before_id', 'after_id', 'count', 'id_field']);
    pagination.count = pagination.count || PaginationService.DEFAULT_PAGINATION_COUNT;
    pagination.id_field = pagination.id_field || 'id';
    return pagination;
  },

  genMetaData: function(data, callback) {
    var min_id = _.min(_.map(data, 'id'));
    var max_id = _.max(_.map(data, 'id'));
    if (!(min_id && max_id)) return callback(null, {});
    callback(null, {
      count: data ? (data.length || 0) : 0,
      next_after_id: max_id,
      next_before_id: min_id
    });
  }
}