package org.imperial.mrc.hint.models

import org.jooq.tools.json.JSONObject
import java.sql.ResultSet

enum class CalibrateResultRowKeys(val key: String) {
    INDICATOR("indicator"),
    MODE("mode"),
    CALENDAR_QUARTER("calendar_quarter"),
    AGE_GROUP("age_group"),
    MEAN("mean"),
    LOWER("lower"),
    SEX("sex"),
    UPPER("upper"),
    AREA_ID("area_id")
}

data class CalibrateResultRow(val resultSet: ResultSet)
{
    
}