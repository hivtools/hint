package org.imperial.mrc.hint.db

import org.jooq.tools.json.JSONArray
import org.jooq.tools.json.JSONObject
import org.springframework.stereotype.Component
import com.fasterxml.jackson.databind.ObjectMapper
import org.imperial.mrc.hint.exceptions.CalibrateDataException
import java.sql.Connection
import java.sql.DriverManager
import java.sql.Statement
import java.util.Properties
import java.util.Locale
import java.sql.ResultSet
import java.sql.SQLException

const val DEFAULT_QUERY = """SELECT
age_group,area_id,
calendar_quarter,
indicator,
ROUND(lower, 4) AS lower,
ROUND(mean, 4) AS mean,
ROUND(mode, 4) AS mode,
sex,
ROUND(upper, 4) AS upper
FROM data"""

interface CalibrateDataRepository
{
    fun getDataFromPath(path: String): JSONObject
}

@Component
class JooqCalibrateDataRepository: CalibrateDataRepository
{

    private fun convertToJSONArray(resultSet: ResultSet): JSONArray {
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

    private fun getDataFromQuery(conn: Connection): JSONArray {
        try {
            var query = DEFAULT_QUERY
            val stmt: Statement = conn.createStatement()
            val resultSet = stmt.executeQuery(query)
            val jsonArray = convertToJSONArray(resultSet)
            return jsonArray
        } finally {
            conn.close()
        }
    }

    @Suppress("SwallowedException")
    private fun getDBConnFromPathResponse(path: String): Connection {   
        val readOnlyProp = Properties()
        readOnlyProp.setProperty("duckdb.read_only", "true")
        var conn: Connection
        try {
            conn = DriverManager.getConnection("jdbc:duckdb:.${path}", readOnlyProp)
        } catch (e: SQLException) {
            throw CalibrateDataException("Could not connect to database")
        }
        return conn
    }

    override fun getDataFromPath(path: String): JSONObject
    {
        val conn = getDBConnFromPathResponse(path)
        val plotData = getDataFromQuery(conn)
        return JSONObject(mapOf("data" to plotData))
    }
}
