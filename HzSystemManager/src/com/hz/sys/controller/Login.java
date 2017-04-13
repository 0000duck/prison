package com.hz.sys.controller;

import java.math.BigInteger;
import java.net.URLDecoder;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.Resource;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.axis.encoding.Base64;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.hz.cache.util.RedisUtil;
import com.hz.db.service.IUpdateService;
import com.hz.db.service.impl.QueryServiceImpl;

@Controller
@RequestMapping("sys/")
public class Login {
	@Value("${session.timeOut}")
	private   int timeOut=3;//超时时间3分钟
	@Value("${superAdmin.name}")
	private String superAdmin;//超级管理员账户
	@Value("${superAdmin.password}")
	private String superAdminpassword;//超级管理员账户
	@Resource
	private QueryServiceImpl service;
	@Resource
	private IUpdateService updateService;
	
	
	@RequestMapping("login")
	@ResponseBody
	public String login(HttpServletRequest request,HttpServletResponse response,String userName,String password,boolean force) throws Exception{
		return validate(request,response,userName,password,force);
	}
	
	@RequestMapping("logout")
    public String logout(HttpServletRequest request){
		Cookie[] cookies=request.getCookies();
		for(Cookie cookie:cookies){
			if(cookie.getName()=="sid"){
				RedisUtil.deleteHash(cookie.getValue());
				break;
			}
		}
		return "-1";
	}
	
	//新增用户
	@RequestMapping("update")
	private String addUser(@RequestParam("userInfo")String userInfo,@RequestParam(required=false) String name,@RequestParam(required=false) String password) throws NoSuchAlgorithmException{
		if(password!=null){
			MessageDigest md = MessageDigest.getInstance("MD5");
			String[] arr=userInfo.split(",");
			//userInfo=userInfo.replace(arr[5].split(":")[1], "\""+new BigInteger(1,md.digest((name+"-"+password).getBytes())).toString(32)+"\"");
			arr[6]=arr[6].replace(password, new BigInteger(1,md.digest((password+"|"+name).getBytes())).toString(32));
			
			userInfo=org.apache.commons.lang.StringUtils.join(arr,",");
		}
		return "forward:../dbCtrl/updateByParamKey?args="+userInfo;
	}
	
	//单点登录接口
	@RequestMapping("singleLogin")
	public String redirect(@RequestParam(required=false)String userName,@RequestParam(required=false) String password,HttpServletRequest request,HttpServletResponse response,Model model) throws Exception{
		
		model.addAttribute("ck", this.validate(request, response,userName, password, false));
		return "page/singleLogin";
	}
	
	//验证用户信息
	private String validate(HttpServletRequest request,HttpServletResponse response,String userName,String password,boolean force) throws Exception{
		
		String key=Base64.encode((userName+password).getBytes());
		userName=URLDecoder.decode(userName,"utf-8");
		Map<String, Object> userInfo=RedisUtil.getHashMap("login_"+key, key);
		
		Cookie cookie=new Cookie("sid",key);
		
		cookie.setPath("/");
		
		response.addCookie(cookie);
		
		if(!force&&userInfo!=null){//判断当前账户是否已经被登录
			if(request.getRemoteHost().equals(userInfo.get("loginip"))){//如果用户已经登录再次登录则直接返回
				//return JSON.toJSONString(userInfo);
			}else{
				JSONObject tip=new JSONObject();
				tip.put("ip", userInfo.get("loginip"));
				return tip.toString();//账户已经被登录 
			}
		}
		
		JSONObject param;
		
		userInfo=new HashMap<String,Object>();
		
		userInfo.put("loginip", request.getRemoteHost());
		
		if(superAdmin.equals(userName)&&superAdminpassword.equals(password)){//如果为超级管理员，只设置数据访问权限
			param=JSONObject.parseObject("{sqlId:'query_user_menu',orderId:'0'}");
			
			List<Map<String,Object>> list=service.query(param);
			
			userInfo.put("data_auth",3);//数据权限等级为3
			
			userInfo.put("menus", list);
			
			userInfo.put("user_name","超级管理员");
			
			String temp=JSON.toJSONString(userInfo);
			
			saveToRedis(key,temp);
			return temp;
		}else{
			MessageDigest md = MessageDigest.getInstance("MD5");
			password=new BigInteger(1,md.digest((password+"|"+userName).getBytes())).toString(32);
			updateService.updateByParamKey(JSONObject.parseObject("{params:[{ip:'"+userInfo.get("loginip")+"',name:'"+userName+"',pwd:'"+password+"'}],sqlId:'update_login_user'}"));
			
			Map<String, Object> map=service.queryMap(JSONObject.parseObject("{params:['"+userName+"','"+password+"'],sqlId:'query_login_user'}"));
			
			if(map!=null){
				userInfo.putAll(map);
			}
		}
		return parseUser(userInfo,key);
	}
	//解析用户信息
	private String parseUser(Map<String, Object> userInfo,String key) throws Exception{
		
		
		if(userInfo.get("id")==null)return "-1";//如果查询未空，用户名或密码不正确，请重试
		
		Object used=userInfo.get("used");
		
		if(used==null||used.toString().equals("0"))return "-2";// 账户未启用，请联系管理员
		
		Date d=(Date) userInfo.get("postdate");
		
		if(userInfo.get("postdate")!=null&&d.getTime()<System.currentTimeMillis())return "-3";//账户已过期，请联系管理员
		
		JSONObject param=JSONObject.parseObject("{params:['"+userInfo.get("id")+"'],sqlId:'query_user_menu',whereId:'0',orderId:'0'}");//查询菜单
		
		List<Map<String,Object>>map=service.query(param);//
		if(map!=null){
			userInfo.put("menus",map);
		}
		String temp=JSON.toJSONString(userInfo);
		
		saveToRedis(key,temp);
		
		return temp;//用户成功登录
	}
	//保存用户会话
	private void saveToRedis(String key,String temp){
		
		RedisUtil.putHash("login_"+key, key, temp);//加入缓存
		
		RedisUtil.getTemplate().expireAt("login_"+key+"_HASH",new Date(System.currentTimeMillis()+1000*60*timeOut));
	}
}
