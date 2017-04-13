package com.hz.cache.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.Resource;

import org.springframework.context.ApplicationEvent;
import org.springframework.context.ApplicationListener;

import com.alibaba.fastjson.JSONObject;
import com.hz.cache.util.RedisUtil;
import com.hz.db.service.IQueryService;


/**
 * 缓存表数据的抽象类
 * @author xie.yh
 */
public abstract class ACacheTable implements ApplicationListener<ApplicationEvent> {
	private boolean initFlag = true;

	@Resource
	protected IQueryService queryService;

	@Override
	public void onApplicationEvent(ApplicationEvent arg0) {
		if (initFlag) {
			initFlag = false;
			Thread tt = new Thread(new Runnable() {
				@Override
				public void run() {
					try {
						Thread.sleep(5000);
						query();
					} catch (InterruptedException e) {
						e.printStackTrace();
					}
				}
			});
			tt.setPriority(Thread.NORM_PRIORITY);
			tt.start();
		}
	}

	/**
	 * 查询数据
	 */
	public abstract Boolean query();


	/**
	 * 查询数据并存入Hash缓存
	 * @param queryJSON 	查询参数实体类对象
	 * @param cacheId 		缓存的数据组编号
	 * @param cacheKey 		数据组中的每条数据的唯一标识字段
	 * @param filedNames 	缓存的数据字段集合
	 * @throws Exception
	 */
	protected Boolean queryAndPutHash(JSONObject queryJSON, String cacheId, String cacheKey, String... filedNames) throws Exception{
		return this.queryAndPutHash(queryJSON, cacheId, new String[]{cacheKey}, filedNames);
	}


	/**
	 * 查询数据并存入Hash缓存
	 * @param queryJSON		查询参数实体类对象
	 * @param cacheId		缓存的数据组编号
	 * @param cacheKeys		数据组中的每条数据的唯一标识组合字段
	 * @param filedNames	缓存的数据字段集合
	 * @return
	 * @throws Exception
	 */
	protected Boolean queryAndPutHash (JSONObject queryJSON, String cacheId, String[] cacheKeys, String... filedNames) throws Exception{
		return RedisUtil.putHash(cacheId, cacheKeys, filedNames, queryService.query(queryJSON));
	}
	
	/**
	 * 查询数据并存入MapList缓存中(存入前会先清除原缓存)
	 * @param queryJSON 查询参数实体类对象
	 * @param cacheId 	缓存的数据组编号
	 * @return
	 * @throws Exception
	 */
	protected Boolean queryAndPutList(JSONObject queryJSON, String cacheId) throws Exception{
		return queryAndPutList(queryJSON, cacheId, new String[0]);
	}


	/**
	 * 查询数据并存入MapList缓存中(存入前会先清除原缓存)
	 * @param queryJSON	查询参数实体类对象
	 * @param cacheId	缓存的数据组编号
	 * @param fields	缓存的数据字段集合
	 * @return
	 * @throws Exception
	 */
	protected Boolean queryAndPutList (JSONObject queryJSON, String cacheId, String... fields) throws Exception {
		List<Map<String, Object>> queryData = queryService.query(queryJSON);
		List<Map<String, Object>> pushData = null;
		Map<String, Object> newMap = null;

		// 检查查询结果
		if (queryData != null && queryData.size() > 0) {
			if (fields != null && fields.length > 0){
				pushData = new ArrayList<Map<String,Object>>();
	
				for (Map<String, Object> tempMap : queryData) {
					newMap = new LinkedHashMap<String, Object>();
	
					for(String field : fields) {
						newMap.put(field, tempMap.get(field));
					}

					pushData.add(newMap);
				}
			} else {
				pushData = queryData;
			}
			
			RedisUtil.deleteList(cacheId);
			RedisUtil.putList(cacheId, pushData);
			return true;
		}
		return false;
	}
}
