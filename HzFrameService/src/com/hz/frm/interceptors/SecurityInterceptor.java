package com.hz.frm.interceptors;

import java.util.Date;
import java.util.Map;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView;

import com.alibaba.fastjson.JSONObject;
import com.hz.cache.util.RedisUtil;

/**
 * 权限拦截器
 * @author zhongxy
 */
public class SecurityInterceptor implements HandlerInterceptor {
	
	@Value("${session.timeOut}")
	private int tiemOut = 3;
	/**
	 * 完成页面的render后调用
	 */
	@Override
	public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object object,
			Exception exception) throws Exception {
	}

	/**
	 * 在调用controller具体方法后拦截
	 */
	@Override
	public void postHandle(HttpServletRequest request, HttpServletResponse response, Object object,
			ModelAndView modelAndView) throws Exception {
	}

	/**
	 * 在调用controller具体方法前拦截
	 */
	@Override
	public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object object) throws Exception {
		response.setContentType("application/json; charset=utf-8");  
		Cookie[] cookies=request.getCookies();
		String  old="";
		if(cookies!=null){
			for(Cookie cookie:cookies){
				if("sid".equals(cookie.getName())){
					old=cookie.getValue();
					break;
				}
			}
		}
		
		JSONObject tip=new JSONObject();
		if(old!=""){
			
			Map<String, Object> user=RedisUtil.getHashMap("login_"+old, old);
			if(user==null){//缓存已被清除登录超时
				tip.put("fail", "登录超时");
				response.getWriter().write(tip.toJSONString());//登录超时
				return false;
			}
			if(!request.getRemoteHost().equals(user.get("loginip"))){
				Cookie cookie=new Cookie("sid","");
				cookie.setMaxAge(0);
				response.addCookie(cookie);
				tip.put("fail", "账户已在"+user.get("loginip")+"登录，您已被迫下线");
				response.getWriter().append(tip.toJSONString());//被迫下线
				return false;
			}
			if (tiemOut > 0)
				RedisUtil.getTemplate().expireAt("login_"+old+"_HASH", new Date(System.currentTimeMillis() + 1000 * 60 * tiemOut));//er十分钟后过期

		}else{
			tip.put("fail", "-1");//未登录
			response.getWriter().append(tip.toJSONString());//未登录
			return false;
		}
		return true;
	}
}
