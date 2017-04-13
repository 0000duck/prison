package com.hz.sql.controller;

import java.util.List;

import javax.annotation.Resource;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import com.alibaba.fastjson.JSONObject;
import com.hz.sql.init.InitSqlConfig;

@Controller
@RequestMapping("sqlCtrl")
public class SqlCtrl {

	@Resource
	private InitSqlConfig sqlConfig;


	@RequestMapping("reload")
	@ResponseBody
	public JSONObject reload () {
		JSONObject respJSON = new JSONObject();
		List<String> repeatList = null;

		boolean result = sqlConfig.init();

		if (result) {
			repeatList = sqlConfig.getRepeatList();
		}

		respJSON.put("result", result);
		respJSON.put("repeat", repeatList);

		return respJSON;
	}
}
