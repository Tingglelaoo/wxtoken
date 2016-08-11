'use strict';
/*
* 处理的逻辑：
* 1.向微信官方接口获取token 附带函数
* 2.缓存token 附带函数
* 3.token过期时自动刷新 附带函数
* 4.用户访问时可以返回有效的token 主函数
* 
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

	// 本地文件形式写入access_token
	self.writeAccessToken = function(data){
		return fs.writeFileAsync(path.join(__dirname, 'token.js'), JSON.stringify(data)).then(function () {
	        console.log("Save Token Success!");
	    },function(err){
	    	if (err) throw err;
	    });
	};

	// 从本地文件中读取access_token
	self.readAccessToken = function(){
		return fs.readFileAsync(path.join(__dirname, 'token.js'),'utf-8').then(function (bytesRead) {
		    self.data = JSON.parse(bytesRead);
		    console.log("Read Token Success!");
		    return self.data;
		},function(err){
			if (err) throw err;
		});

	};

	// 获取access_token并写入文件
	self.getAccessToken = function (){

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

	// 自动更新access_token，以保持长期有效
	self.autoRefreshAccessToken = function(){
		// 设定定时器，提前60s重新获取
		var delay = self.data.expires_in ? (Number(self.data.expires_in) - 60) * 1000 : null;
		if(!delay) return console.log(self.data);
		self.schedule = function(){ 
			setTimeout(function(){
				self.getAccessToken().then(function(data){
					return self.writeAccessToken(data);
				}).then(function(){
					self.schedule();
				})
			},delay);
			console.log(self.data);
		};
		self.schedule();
		
	};

	// 初始化
	self.init = function(){
		return new Promise(function(reslove,reject){
			self.getAccessToken().then(function(data){
				return self.writeAccessToken(data);
			}).then(function(){
				self.autoRefreshAccessToken();
				reslove();
			},reject);
		})
		
	}

};
Token.prototype.getToken = function(){
	var self = this;
	return new Promise(function(resolve,reject){
		self.init().then(function(){
			self.readAccessToken().then(function(data){
				resolve(data);
			})
		},reject);
	});
}


/**
 * 主函数，直接调用可获取token
 * @param {[type]} appid     
 * @param {[type]} appsecret 
 */
var auth = function(appid,appsecret){
	return new Token(appid,appsecret);
}

module.exports = auth;