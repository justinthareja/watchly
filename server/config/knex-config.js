var knex;
if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined) {
knex = require('knex')({
  client: 'mysql',
  connection: {
    user: 'root',
    host: '127.0.0.1',
    database: 'watchly',
    charset: 'utf8'
  }
});
} else if (process.env.NODE_ENV === 'production') {
  knex = require('knex')({
    client: 'mysql',
    connection : {
       host : 'us-cdbr-iron-east-02.cleardb.net',
       user : 'b821932131f56c',
       password : 'ce0d1daf',
       database : 'heroku_033c9dc05af850f',
       charset : 'utf8'
     }
  });
}
module.exports = knex; 
