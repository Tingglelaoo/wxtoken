var express = require('express');
var router = express.Router();
var auth = require('./auth'); // 自己封装的函数


// 获取token的参数，可在“微信公众平台－开发－基本配置”中找到
var APPID = 'your appid';
var APPSECRET = 'your appsecret';

var api = new auth(APPID,APPSECRET);

/* GET home page. */
router.get('/', function(req, res, next) {
	api.getToken().then(function(data){
		console.log('token:'+ JSON.stringify(data));
		res.jsonp(data);
	});
	
});

module.exports = router;
