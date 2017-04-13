package com.hz.cds.video.controller;

import java.io.File;
import java.util.List;
import java.util.Map;

import javax.annotation.Resource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.hz.cds.video.cache.CameraBaseDtlsCache;
import com.hz.cds.video.cache.VideoDeviceBaseDtlsCache;
import com.hz.db.service.IQueryService;
import com.hz.db.util.DbCodeUtil;
import com.hz.db.util.RespParams;
import com.hz.frm.util.StringUtil;
import com.hz.frm.util.Tools;

@Controller
@RequestMapping("cameraCtr")
public class CameraCtr {
	private Logger logger=LoggerFactory.getLogger(CameraCtr.class);

	@Resource
	private CameraBaseDtlsCache cameraBaseDtlsCache;

	@Resource
	private VideoDeviceBaseDtlsCache videoDeviceBaseDtlsCache;

	@Resource
	IQueryService queryService;

	/**
	 * 通过摄像机ID查询打开实时视频的信息
	 * @param args
	 * @return
	 */
	@RequestMapping("queryCameraInfoForPlayVideo")
	@ResponseBody
	public JSONObject queryCameraInfoForPlayVideo (@RequestParam() String args) {
		JSONObject reqJSON = null;
		try {
			reqJSON = JSON.parseObject(args);
			JSONArray caremaArray=getCameraInfo(reqJSON);
			return response(DbCodeUtil.CODE_0000, "", caremaArray);
		} catch (Exception e) {
			logger.error("查询摄像机信息失败", e);
			return response(DbCodeUtil.CODE_0001, "", "查询摄像机信息失败");
		}

	}
	
	/**
	 * 临时使用，背后调用公用的
	 * @param code
	 * @param msg
	 * @param data
	 * @return
	 */
	private JSONObject response (String code, String msg, Object data) {
		JSONObject result = null;	// 响应结果
		result = new JSONObject();
		result.put(RespParams.SUCCESS, DbCodeUtil.CODE_0000.equals(code));		
		result.put(RespParams.RESP_CODE, code);
		result.put(RespParams.RESP_MSG, msg);
		result.put(RespParams.DATA, data);
		return result;
	}
	
	/**
	 * 获取摄像机信息
	 * @param reqJSON
	 * @param type 1 实时视频   2 视频回放
	 * @return
	 */
	private JSONArray getCameraInfo(JSONObject reqJSON){
		JSONArray cameraInfoArray=new JSONArray();
		String cusNumber=reqJSON.getString("cusNumber");
		String cameraArray=reqJSON.getString("cameraArray");
		String type=reqJSON.getString("type");
		if(!StringUtil.isNull(cameraArray)){
			JSONArray cameraIdArray=JSONArray.parseArray(cameraArray);
			for(int i=0;i<cameraIdArray.size();i++){
				JSONObject cameraObj=cameraIdArray.getJSONObject(i);
				JSONObject cameraMessage=new JSONObject();
				if(!StringUtil.isNull(type)&&"2".equals(type)){
					String startTime=cameraObj.getString("beginTime");
					String endTime=cameraObj.getString("endTime");
					cameraMessage.put("startTime", startTime);
					cameraMessage.put("endTime", endTime);
				}
				String cameraId=cameraObj.getString("cameraId");
				String index=cameraObj.getString("index");
				if(!StringUtil.isNull(index)){
					cameraMessage.put("index", index);
				}
				
				//摄像机的基本信息
				JSONObject cameraObjInfo=null;
				try {
					cameraObjInfo = cameraBaseDtlsCache.getCameraInfo(cusNumber, cameraId);
				} catch (Exception e) {
					logger.error("获取摄像机基础信息异常：", e);
				}
				if(cameraObjInfo!=null){
					cameraMessage.put("cameraId", cameraObjInfo.getString("cbd_id"));
					cameraMessage.put("cameraName", cameraObjInfo.getString("cbd_name"));
					cameraMessage.put("cameraBrand", cameraObjInfo.getString("cbd_brand"));
					cameraMessage.put("streamType", cameraObjInfo.getString("cbd_stream_type"));
					if(!StringUtil.isNull(type)&&"1".equals(type)){
						cameraMessage.put("mode", cameraObjInfo.getString("cbd_playnow_type"));
					}else{
						cameraMessage.put("mode", cameraObjInfo.getString("cbd_playback_type"));
					}
					
				}
				
				//NVR信息
				JSONObject nvrObjInfo=null;
				try {
					nvrObjInfo = videoDeviceBaseDtlsCache.getNvrDeviceInfo(cusNumber, cameraId);
				} catch (Exception e) {
					logger.error("获取NVR信息失败"+e.getMessage());
				}
				JSONObject nvrObj=new JSONObject();
				if(nvrObjInfo!=null){
					nvrObj.put("channel",nvrObjInfo.getString("cvr_chnnl_code"));
					nvrObj.put("brand", nvrObjInfo.getString("vdd_device_brand"));
					nvrObj.put("ip", nvrObjInfo.getString("vdd_ip_addrs"));
					nvrObj.put("port", nvrObjInfo.getString("vdd_port"));
					nvrObj.put("userName", nvrObjInfo.getString("vdd_user_name"));
					nvrObj.put("password", nvrObjInfo.getString("vdd_user_password"));
				}
				cameraMessage.put("dvr", nvrObj);
				
				//平台信息
				JSONObject platformObjInfo=null;
				try {
					platformObjInfo = videoDeviceBaseDtlsCache.getPlatformInfo(cusNumber, cameraId);
				} catch (Exception e) {
				}
				JSONObject platformObj=new JSONObject();
				if(platformObjInfo!=null){
					platformObj.put("id",platformObjInfo.getString("cvr_chnnl_code"));
					platformObj.put("brand", platformObjInfo.getString("vdd_device_brand"));
					platformObj.put("ip", platformObjInfo.getString("vdd_ip_addrs"));
					platformObj.put("port", platformObjInfo.getString("vdd_port"));
					platformObj.put("userName", platformObjInfo.getString("vdd_user_name"));
					platformObj.put("password", platformObjInfo.getString("vdd_user_password"));
				}
				cameraMessage.put("platform", platformObj);
				
				//流媒体信息
				if(!StringUtil.isNull(type)&&"1".equals(type)){
					JSONObject streamObjInfo=null;
					try {
						streamObjInfo = videoDeviceBaseDtlsCache.getStreamInfo(cusNumber, cameraId);
					} catch (Exception e) {
					}
					JSONObject streamObj=new JSONObject();
					if(streamObjInfo!=null){
						streamObj.put("ip", streamObjInfo.getString("vdd_ip_addrs"));
						streamObj.put("port", streamObjInfo.getString("vdd_port"));
						streamObj.put("streamType", streamObjInfo.getString("vdd_user_name"));
					}
					cameraMessage.put("stream", streamObj);
				}
				
				cameraInfoArray.add(cameraMessage);
			}
			
		}
		return cameraInfoArray;
	}


	int fileNum = 1001;

	@RequestMapping("videoStorageRecord")
	@ResponseBody
	public JSONArray videoStorageRecord (@RequestParam String cusNumber) {
		JSONArray jsonArray = new JSONArray();

		JSONArray params = null;
		List<Map<String, Object>> result = null;

		String path = "";
		String name = "";
		File file = null;
		File[] files = null;

		int fileId = 0;

		try {
			params = new JSONArray();
			params.add(cusNumber);

			result = queryService.query("query_video_storage_path_for_tree", "0", params);

			if (result != null && result.size() > 0) {
				fileNum = 1001;

				for(Map<String, Object> rowMap : result) {
					try {
						path = Tools.toStr(rowMap.get("vel_storage_addr"), "");
						name = rowMap.get("vel_event_name") + "[" + path + "]";						
						file = new File(path);
						files = file.listFiles();
						fileId = fileNum++;

						if (files != null) {
//							putArray(jsonArray, "-1", fileId, name, path);
							readNext(jsonArray, fileId, files);
						} else {
							name += "(无效地址)";
						}
					} catch (Exception e) {
						name += "(读取错误)";
						logger.error("读取存储目录错误：", e);
					} finally {
						putArray(jsonArray, "-1", fileId, name, path);
					}
				}
			}
		} catch (Exception e) {
			logger.error("读取存储目录异常：", e);
		}

		return jsonArray;
	}

	@RequestMapping("getDirList")
	@ResponseBody
	public JSONArray getDirList (@RequestParam String dirPath) {
		JSONArray jsonArray = new JSONArray();
		JSONObject jsonObj = null;

		try {
			File dirFile = new File(dirPath);
			File[] files = dirFile.listFiles();
			int id = 1;

			if (files != null) {
				for(File file : files) {
					jsonObj = new JSONObject();
					jsonObj.put("id", id++);
					jsonObj.put("name", file.getName());
					jsonObj.put("path", file.getPath());
					jsonObj.put("isDir", file.isDirectory());
					jsonArray.add(jsonObj);
				}
			}
		} catch (Exception e) {
			logger.error("读取存储目录列表错误：", e);
		}

		return jsonArray;
	}


	/*
	 * 读取下级目录
	 */
	private void readNext (JSONArray jsonArray, int pid, File[] files) {
		int fileId = 0;
		for(File file : files) {
			if (file.isDirectory()) {
				fileId = fileNum++;
				putArray(jsonArray, pid, fileId, file.getName(), file.getPath());
				readNext(jsonArray, fileId, file.listFiles());
			}
		}
	}

	/*
	 * 存放数据
	 */
	private void putArray (JSONArray jsonArray, Object pid, Object id, Object name, Object path) {
		JSONObject jsonObj = null;

		jsonObj = new JSONObject();
		jsonObj.put("pid", pid);
		jsonObj.put("id", id);
		jsonObj.put("name", name);
		jsonObj.put("dirPath", path);
		jsonArray.add(jsonObj);
	}


	public static void main(String[] args) {

	}
}
