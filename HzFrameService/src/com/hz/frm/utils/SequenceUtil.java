package com.hz.frm.utils;

import java.math.BigDecimal;

import javax.annotation.Resource;

import org.springframework.stereotype.Component;

import com.hz.db.dao.ExecuteDao;

@Component
public class SequenceUtil {

	@Resource
	private ExecuteDao executeDao;


	/**
	 * 获取序列号
	 * @param tableName		表名（不区分大小写，统一转大写）
	 * @param columnName	字段名（不区分大小写，统一转大写）
	 * @return 序列号
	 * @throws Exception
	 */
	public synchronized String getSequence (String tableName, String columnName) throws Exception {
		BigDecimal seq = executeDao.function(BigDecimal.class, "FMS_F_SEQ_GET", tableName.toUpperCase(), columnName.toUpperCase());
		if (seq != null) {
			return seq.toString();
		} else
			return null;
	}
}
