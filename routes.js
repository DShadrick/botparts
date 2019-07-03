
function register(app) {
  app.get('/status', function(req, res){
    res.sendStatus(200);
  })
}

module.exports = {
  register: register
}

