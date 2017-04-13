package com.hz.cds.rfid.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import com.alibaba.fastjson.JSON;
import com.hz.cache.util.RedisUtil;
import com.hz.cds.rfid.utils.RFIDConstants;

@Controller
@RequestMapping("/rfidController")
public class RfidController {

	/**
	 * 查询rfid缓存数据
	 * @return
	 */
	@SuppressWarnings("unchecked")
	@RequestMapping("/queryRedisData")
	@ResponseBody
	public Object queryRedisData(String cusNumber,String prisonerId){
		String cacheKey = RFIDConstants.REDIS_KEY+"_"+cusNumber;
		Object o = RedisUtil.getOpsObject(cacheKey);
		Map<String,Object> map = JSON.parseObject(String.valueOf(o),HashMap.class);
		if(map != null){
			Object list = map.get(prisonerId);
			return list == null ? "" : list;
		}else{
			return "";
		}
	}
}
