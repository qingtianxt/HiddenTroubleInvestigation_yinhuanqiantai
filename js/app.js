/**
 * 演示程序当前的 “注册/登录” 等操作，是基于 “本地存储” 完成的
 * 当您要参考这个演示程序进行相关 app 的开发时，
 * 请注意将相关方法调整成 “基于服务端Service” 的实现。
 **/

(function($, owner) {
	/**
	 * 用户登录
	 **/
	var result = null;

	owner.login = function(loginInfo, callback) {

		callback = callback || $.noop;
		loginInfo = loginInfo || {};
		loginInfo.account = loginInfo.account || '';
		loginInfo.password = loginInfo.password || '';
		/*if (!(/^1([358][0-9]|4[579]|66|7[0135678]|9[89])[0-9]{8}$/.test(loginInfo.account))) {
			return callback('不是完整的手机号');
		}*/
		if(loginInfo.account.length < 5) {
			return callback('账号最短为 5 个字符');
		}
		if(loginInfo.password.length < 6) {
			return callback('密码最短为 6 个字符');
		}

		var url = "http://10.92.4.110:8080/HiddenTroubleInvestigation/user_checkByTelephoneAndPasswordForUI.action?telephone=" + loginInfo.account + "&password=" + loginInfo.password;
		console.log(url);
		mui.ajax(url, {
			data: {},
			dataType: 'jsonp', //服务器返回json格式数据
			type: 'POST', //HTTP请求类型.
			async: 'false',
			timeout: 10000, //超时时间设置为10秒；
			headers: {
				'Content-Type': 'application/json'
			},
			success: function(data) {
				if(result == 0) {
					return callback('该用户不存在');
				} else if(result == 1) {
					return callback('密码不正确');
				} else {
					var json = eval("(" + result + ")");
					var users = JSON.parse(localStorage.getItem('$users') || '[]');
					var authed = users.some(function(user) {
						return loginInfo.account == user.account && loginInfo.password == user.password;
					});
					//return owner.createState(json.user_id, callback);
					return owner.createState(result.user_id, callback);
				}
				/*	if(authed) {
						return owner.createState(loginInfo.account, callback);
					} else {
						//return callback('用户名或密码错误');
					}*/
			},
			error: function(xhr, type, errorThrown) { //异常处理；
				console.log(type);
				mui.toast("网络出问题了")
			}
		});

	};

	owner.createState = function(user_id, callback) {
		var state = owner.getState();
		state.user_id = user_id;
		state.token = "token123456789";
		owner.setState(state);
		return callback();
	};

	/**
	 * 新用户注册
	 **/
	owner.reg = function(regInfo, callback) {
		callback = callback || $.noop;
		regInfo = regInfo || {};
		regInfo.account = regInfo.account || '';
		regInfo.password = regInfo.password || '';
		/*if (!(/^1([358][0-9]|4[579]|66|7[0135678]|9[89])[0-9]{8}$/.test(loginInfo.account))) {
			return callback('不是完整的手机号');
		}*/
		if(loginInfo.account.length < 5) {
			return callback('账号最短为 5 个字符');
		}
		if(regInfo.password.length < 6) {
			return callback('密码最短需要 6 个字符');
		}
		/*if (!checkEmail(regInfo.email)) {
			return callback('邮箱地址不合法');
		}*/
		var users = JSON.parse(localStorage.getItem('$users') || '[]');
		users.push(regInfo);
		localStorage.setItem('$users', JSON.stringify(users));
		return callback();
	};

	/**
	 * 获取当前状态
	 **/
	owner.getState = function() {
		var stateText = localStorage.getItem('$state') || "{}";
		return JSON.parse(stateText);
	};

	/**
	 * 设置当前状态
	 **/
	owner.setState = function(state) {
		state = state || {};
		localStorage.setItem('$state', JSON.stringify(state));
		//var settings = owner.getSettings();
		//settings.gestures = '';
		//owner.setSettings(settings);
	};
	/*可以看到这两个是对localStorage的存取做了封装，是一个字典对象，这是个很不错的想法，
	可以将用户登录后的所有状态信息记录在state里面，包括用户信息，是否自动登录，用户余额，
	订单列表页的最新和最旧ID等都保存下来，用户注销后直接把state置为null就可以了，再次登录后
	再设置state。上面的登录就是这样做的，登录成功后保存用户信息在state里面，然后触发涉及
	用户的main页面的事件，main页面里自定义事件的响应函数可以从state里读取信息并更新。*/

	var checkEmail = function(email) {
		email = email || '';
		return(email.length > 3 && email.indexOf('@') > -1);
	};

	/**
	 * 找回密码
	 **/
	owner.forgetPassword = function(email, callback) {
		callback = callback || $.noop;
		if(!checkEmail(email)) {
			return callback('邮箱地址不合法');
		}
		return callback(null, '新的随机密码已经发送到您的邮箱，请查收邮件。');
	};

	/**
	 * 获取应用本地配置
	 **/
	owner.setSettings = function(settings) {
		settings = settings || {};
		localStorage.setItem('$settings', JSON.stringify(settings));
	}

	/**
	 * 设置应用本地配置
	 **/
	owner.getSettings = function() {
		var settingsText = localStorage.getItem('$settings') || "{}";
		return JSON.parse(settingsText);
	}
	/**
	 * 获取本地是否安装客户端
	 **/
	owner.isInstalled = function(id) {
		if(id === 'qihoo' && mui.os.plus) {
			return true;
		}
		if(mui.os.android) {
			var main = plus.android.runtimeMainActivity();
			var packageManager = main.getPackageManager();
			var PackageManager = plus.android.importClass(packageManager)
			var packageName = {
				"qq": "com.tencent.mobileqq",
				"weixin": "com.tencent.mm",
				"sinaweibo": "com.sina.weibo"
			}
			try {
				return packageManager.getPackageInfo(packageName[id], PackageManager.GET_ACTIVITIES);
			} catch(e) {}
		} else {
			switch(id) {
				case "qq":
					var TencentOAuth = plus.ios.import("TencentOAuth");
					return TencentOAuth.iphoneQQInstalled();
				case "weixin":
					var WXApi = plus.ios.import("WXApi");
					return WXApi.isWXAppInstalled()
				case "sinaweibo":
					var SinaAPI = plus.ios.import("WeiboSDK");
					return SinaAPI.isWeiboAppInstalled()
				default:
					break;
			}
		}
	}
}(mui, window.app = {}));