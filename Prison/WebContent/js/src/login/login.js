define(["jquery","frm/message","frm/localStorage"],function($,tip,local){
	$("#login").click(function(){
		login(this,false);
	});
	document.onkeyup=function(e){
		e.which==13&&document.getElementById("login").click();
	}
	function login(_this,force){
		var pwd=[_this.parentElement.children[1].children[0].value,encodeURI(_this.parentElement.children[0].children[0].value)];
		if(!pwd[0]||!pwd[1]){
			tip.alert("用户名或密码不能为空");
			return ;
		}
		$.post("sys/login",{"password":pwd[0],"userName":pwd[1],"force":force},function(data){
			data=JSON.parse(JSON.parse(data));
			if(typeof data=="number"){
				switch(data){
					case -1:
						tip.alert("用户名或密码不正确，请重试");
						break;
					case -2:
						tip.alert("账户未启用，请联系管理员");
						break;
					case -3:
						tip.alert("账户已过期，请联系管理员");
						break;
				}
			}else{
				if(data.ip){
					tip.confirm("账户已在"+data.ip+"登录是否强制登录",function(){
						login(_this,true);
					});
				}else{
					local.setItem('userInfo',data);
					window.location.href="index.html";
				}
				
			}
		});
	}
});