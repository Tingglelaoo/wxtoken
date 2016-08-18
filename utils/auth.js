'use strict';
/*
* 处理的逻辑：
* 1.向微信官方接口获取token 附带函数
* 2.缓存token 附带函数
* 3.token过期时自动刷新 附带函数
* 4.用户访问时可以返回有效的token 主函数
* 
 */
 /**缓存刷新策略：
  * 现在用了轮询检查刷新的方法，其实可以不用轮询的。每次从服务端获取Token的时候，
  * 2.1 看是否有文件缓存
  * 2.2 如果没有，则从服务器端获取，并存入缓存
  * 2.3 如果有，拿（当前时间戳 - 已缓存的Token的时间戳），看是否超出过期时间
  * 2.3.1 如果超出过期时间，进入2.2
  * 2.3.2 如果没过期，直接返回缓存的Token
  */
 
var urllib = require('urllib');
var path = require('path');
var fs= require('fs');
var Promise = require('bluebird');

Promise.promisifyAll(fs);


var Token = function (appid,appsecret) {
	var self = this;

	self.data = {};
	self.APPID = appid;
	self.APPSECRET = appsecret;
	self.TOKEN_URL = 'https://api.weixin.qq.com/cgi-bin/token';

};

// 以本地文件形式写入access_token
Token.prototype.writeAccessToken = function(data){
	var self = this;

	return fs.writeFileAsync(path.join(__dirname, 'token.js'), JSON.stringify(data),{flag:'w+'}).then(function () {
        console.log("Save Token Success!");
    },function(err){
    	if (err) throw err;
    });
};

// 从本地文件中读取access_token
Token.prototype.readAccessToken = function(){
	var self = this;

	return fs.readFileAsync(path.join(__dirname, 'token.js'),'utf-8').then(function (bytesRead) {
	    self.data = JSON.parse(bytesRead);
	    console.log("Read Token Success!");
	    return self.data;
	},function(err){
		if (err) throw err;
	});
};

// 从服务端获取access_token
Token.prototype.getAccessToken = function (){
	var self = this;

	return new Promise(function(resolve,reject){
		urllib.request(self.TOKEN_URL, {
		  method: 'GET',
		  data: {
		    'grant_type': 'client_credential',
		    'appid': self.APPID,
		    'secret': self.APPSECRET
		  }
		},function(err,data,res){
			if(err) reject(err);
			var tmp = JSON.parse(data);
			tmp.create_at = new Date().getTime();
			for(var key in tmp){
				self.data[key] = tmp[key];
			}
			resolve(self.data);
			console.log("GET Token Success!");
		});
	});
};

// 获取access_token并更新本地缓存
Token.prototype.refreshAccessToken = function(){
	var self = this;
	return new Promise(function(resolve,reject){
		self.getAccessToken()
		.then(function(data){
			self.writeAccessToken(data)
			resolve(data);
		});
	});
};

// 检测是否有效 
Token.prototype.isValid = function () {
	var self = this;
	var token = self.data;
  	return !!token && (new Date().getTime()) < (token.create_at + token.expires_in * 1000);
};

// 初始化获取
Token.prototype.init = function(){
	var self = this;
	self.refreshAccessToken();
	console.log('init');
}

// 开放接口
Token.prototype.getToken = function(){
	var self = this;
	return new Promise(function(resolve,reject){
		self.readAccessToken().then(function(data){
			// 若本地缓存无效，则从服务端获取并更新本地缓存
			if(!self.isValid()){ 
				console.log('refresh');
				self.refreshAccessToken()
				.then(function(data){
					return resolve(data);
				});
			}else {
				return resolve(data);
			}
		},reject)
	});
}


/**
 * 主函数，直接调用可获取token
 * @param {[type]} appid     
 * @param {[type]} appsecret 
 */
var auth = function(appid,appsecret){
	var token = new Token(appid,appsecret);
	token.init();
	return token;
}

module.exports = auth;