package com.hz.cds.video.vedioPlan;

import org.quartz.Job;
import org.quartz.JobDataMap;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;

import com.alibaba.fastjson.JSONObject;
import com.hz.db.service.IUpdateService;
import com.hz.frm.util.ApplicationContextUtil;

public class PlanTask implements Job{
	
	private static  ApplicationContextUtil app=ApplicationContextUtil.getInstance();
	

	@Override
	public void execute(JobExecutionContext job) throws JobExecutionException {
		JobDataMap jobDetail=job.getJobDetail().getJobDataMap();
	 
		String planid=jobDetail.getString("planId");//获取要巡视计划主键
	 
	 
		String cus=jobDetail.getString("cus");//获取要巡视计划主键
		
		try {
			 
			IUpdateService updateService=(IUpdateService) app.getBean("updateServiceImpl");
			 
			String sqlParam="[{params:[{cus:'"+cus+"',planid:'"+planid+"'}],sqlId:'insert_into_vedio_plan_record'}]";
			
			updateService.updateByParamKey(JSONObject.parseArray(sqlParam));
			
			//向指定的执行人发送提醒发送消息
			String userId=jobDetail.getString("userId");
			
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
	public static void main(String args[]){
		String sqlParam="[{params:{cus:'ddd',planid:'dd'},sqlId:'insert_into_vedio_plan_record'}]";
		
		JSONObject.parseObject(sqlParam);
	}
}
