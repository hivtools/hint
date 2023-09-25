package org.imperial.mrc.hint

import org.springframework.http.ResponseEntity
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.jooq.tools.json.JSONArray
import org.jooq.tools.json.JSONObject
import java.util.Properties
import java.util.Locale
import java.sql.Connection
import java.sql.DriverManager
import java.sql.Statement
import java.sql.ResultSet
import java.lang.Exception
import com.fasterxml.jackson.databind.ObjectMapper

fun getDBConnFromPathResponse(res: ResponseEntity<String>): Connection? {   
    val jsonBody = ObjectMapper().readTree(res.body?.toString())
    val path = jsonBody?.get("data")?.get("path")
    if (path == null) {
        return null
    }
    val pathText = path.textValue()
    val readOnlyProp = Properties()
    readOnlyProp.setProperty("duckdb.read_only", "true")
    return DriverManager.getConnection("jdbc:duckdb:.${pathText}", readOnlyProp)
}

const val defaultQuery = """SELECT
age_group,area_id,
calendar_quarter,
indicator,
ROUND(lower, 4) AS lower,
ROUND(mean, 4) AS mean,
ROUND(mode, 4) AS mode,
sex,
ROUND(upper, 4) AS upper
FROM data"""

fun getDataFromQuery(conn: Connection, userQuery: String?): JSONArray? {
    try {
        var query = defaultQuery
        if (userQuery != null) {
            query = userQuery
        }
        val stmt: Statement = conn.createStatement()
        val resultSet = stmt.executeQuery(query)
        val jsonArray = convertToJSONArray(resultSet)
        return jsonArray
    } finally {
        conn.close()
    }
}

fun convertToJSONArray(resultSet: ResultSet): JSONArray {
    val jsonArray = JSONArray()
    while (resultSet.next()) {
        val obj = JSONObject()
        val totalRows = resultSet.metaData.columnCount
        for (i in 0 until totalRows) {
            obj[resultSet.metaData.getColumnLabel(i + 1)
                .lowercase(Locale.getDefault())] = resultSet.getObject(i + 1)
        }
        jsonArray.add(obj)
    }
    return jsonArray
}

fun getResponseEntity(dataObj: JSONObject?, textStatus: String, status: HttpStatus, err: String?): ResponseEntity<String> {
    val errArr = JSONArray(listOf(JSONObject(mapOf("error" to "FAILED_TO_RETRIEVE_RESULT", "detail" to err))))
    val resObj = JSONObject(mapOf(
        "status" to textStatus,
        "data" to dataObj,
        "errors" to if (err != null) {
            errArr
        } else {
            null
        }
    ))
    return ResponseEntity.status(status)
        .contentType(MediaType.APPLICATION_JSON)
        .body(resObj.toString())
}
