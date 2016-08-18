var express = require('express');
var router = express.Router();
// 自己封装的函数
var auth = require('../utils/auth'); 
var config = require('../configs/config');


var api = new auth(config.APPID,config.APPSECRET);

/* GET home page. */
router.get('/', function(req, res, next) {
	api.getToken().then(function(data){
		console.log('token:'+ JSON.stringify(data));
		res.jsonp(data);
	});
	
});

module.exports = router;
