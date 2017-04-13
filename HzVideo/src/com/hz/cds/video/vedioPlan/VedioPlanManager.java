package com.hz.cds.video.vedioPlan;

import org.quartz.CronScheduleBuilder;
import org.quartz.CronTrigger;
import org.quartz.Job;
import org.quartz.JobBuilder;
import org.quartz.JobDataMap;
import org.quartz.JobDetail;
import org.quartz.JobKey;
import org.quartz.Scheduler;
import org.quartz.SchedulerFactory;
import org.quartz.Trigger;
import org.quartz.TriggerBuilder;
import org.quartz.TriggerKey;
import org.quartz.impl.StdSchedulerFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.hz.cds.video.message.FePatrolMessageActivator;



/*@author  ck*/

public class VedioPlanManager {
	private static final Logger logger = LoggerFactory.getLogger(FePatrolMessageActivator.class);
	
	private static SchedulerFactory ckChedulerFactory = new StdSchedulerFactory();  
	
	private static String JOB_GROUP="VEDIO_PLAN_JOB_GROUP";//任务组
	
	private static String TRIGGER_GROUP="VEDIO_PLAN_TRIGGER_GROUP";//触发组
	
	
	
	public  static void addJob(String name,String time,String fre,String cus,String planId,Class<? extends Job> task){
		
		try{
			
			Scheduler scheduler = ckChedulerFactory.getScheduler();
			
			JobDetail job = JobBuilder.newJob(task).withIdentity(name, VedioPlanManager.JOB_GROUP).build();
			
			JobDataMap map=job.getJobDataMap();
			
			map.put("planId",planId); 
			
			map.put("cus",cus); 
			
			String con=parseTime(time,fre);
			
			Trigger trigger=TriggerBuilder.newTrigger().withIdentity(name, VedioPlanManager.TRIGGER_GROUP).withSchedule(CronScheduleBuilder.cronSchedule(con)).build();
			
			scheduler.scheduleJob(job, trigger);
			
			if(!scheduler.isStarted()){
				
				scheduler.start();
				
			}
		}catch(Exception e){
			logger.info("任务添加失败："+e);
		}
	}
	//删除任务
	public static void removeJob(String name){
		
		try{
			
			Scheduler sch=ckChedulerFactory.getScheduler();
			
			JobKey key=new JobKey(name,VedioPlanManager.JOB_GROUP);
			
			TriggerKey trigger=new TriggerKey(name,VedioPlanManager.TRIGGER_GROUP);
			
			sch.pauseTrigger(trigger);
			
			sch.pauseJob(key);
			
			sch.unscheduleJob(trigger);
			
			sch.deleteJob(key);
			
		}catch(Exception e){
			
			logger.info("任务删除失败"+e);
			
		}
	}
	
	
	public static void editJob(String name,String time,String fre,String planId){
		time=parseTime(time,fre);
		try{
			Scheduler sch=ckChedulerFactory.getScheduler();
			
			CronTrigger  trigger=(CronTrigger) sch.getTrigger(new TriggerKey(name,VedioPlanManager.TRIGGER_GROUP));
			if(trigger==null){
				return;
			}
			
			String oldTime = trigger.getCronExpression();  
			
            if (!oldTime.equalsIgnoreCase(time)) {  
            	
                JobDetail jobDetail = sch.getJobDetail(new JobKey(name,VedioPlanManager.JOB_GROUP));  
                
                removeJob(name);  
                
                addJob(name, time,fre,jobDetail.getJobDataMap().getString("cus"),  planId, jobDetail.getJobClass());  
            } 
			
		}catch(Exception e){
			logger.info("任务修失败"+e);
		}
	}
	
	private static String parseTime(String time,String frequences){
		String[]  temp=time.split(":");
		time=temp[2]+" "+temp[1]+" "+temp[0];
		if("1".equals(frequences)){//每天
			return time+" * * ?";
		}else if("2".equals(frequences)){//每
			return time+" * * ?";
		}
		return "";
	}
}
