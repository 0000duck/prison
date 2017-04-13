package com.hz.cds.video.controller;

import java.util.Map;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.alibaba.fastjson.JSONArray;
import com.hz.cds.video.vedioPlan.PlanTask;
import com.hz.cds.video.vedioPlan.VedioPlanManager;

@Controller
@RequestMapping("vedioPlan")
public class VedioPlan {

	@SuppressWarnings("unchecked")
	@RequestMapping("opr")
	@ResponseBody
	public String opr(@RequestParam String args) {
		
		Map<String, String>[] arr = JSONArray.parseObject(args, Map[].class);
		
		Map<String, String> task;
		
		String opr;
		
		for (int i = 0; i < arr.length; i++) {
			
			task =arr[i];
			opr=task.get("opr");
			System.out.println("?????????????????"+task.get("opr"));
			
			if("add".equals(opr)){
				System.out.println("?????????????????1"+task.get("opr"));
				VedioPlanManager.addJob(task.get("vpp_name"),task.get("vpp_excute_time"), task.get("vpp_frequenes"),task.get("cus") ,task.get("vpp_id"),PlanTask.class);
				
			}else if("update".equals(opr)){
				System.out.println("?????????????????2"+task.get("opr"));
				VedioPlanManager.editJob(task.get("vpp_name"),task.get("vpp_excute_time"), task.get("vpp_frequenes"), task.get("vpp_id"));
				
			}else if("remove".equals(opr)){
				System.out.println("?????????????????3"+task.get("opr"));
				VedioPlanManager.removeJob(task.get("vpp_name"));
				
			}
		}
		
		return "1";
	}
	
	public static void main(String args[]){
		
		String d="[{\"sqlId\":\"insert_vedio_plan\",\"params\":[{\"vpp_cus_number\":3223,\"vpp_name\":\"\",\"vpp_excute_time\":\"09:57:00\",\"vpp_frequenes\":\"1\",\"vpp_creater\":10286,\"index\":0}],\"opr\":\"add\"}]";
		System.out.println(JSONArray.parseArray(d));
	}
}
