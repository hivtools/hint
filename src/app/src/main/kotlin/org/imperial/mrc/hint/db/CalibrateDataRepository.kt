package org.imperial.mrc.hint.db

import org.jooq.tools.json.JSONArray
import org.jooq.tools.json.JSONObject
import org.springframework.stereotype.Component
import com.fasterxml.jackson.databind.ObjectMapper
import org.imperial.mrc.hint.exceptions.CalibrateDataException
import org.imperial.mrc.hint.models.CalibrateResultRow
import org.imperial.mrc.hint.models.CalibrateResultRowKeys
// import org.imperial.mrc.hint.models.CalibrateResultRow
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
    fun getDataFromPath(path: String): JSONArray
}

@Component
class JooqCalibrateDataRepository: CalibrateDataRepository
{

    private fun convertToArrayList(resultSet: ResultSet): ArrayList<CalibrateResultRow> {
        val list: ArrayList<CalibrateResultRow> = arrayListOf()
        while (resultSet.next()) {
            val row = CalibrateResultRow(
                resultSet.getString("indicator"),
                resultSet.getString("calendar_quarter"),
                resultSet.getString("age_group"),
                resultSet.getString("sex"),
                resultSet.getString("area_id"),
                resultSet.getFloat("mode"),
                resultSet.getFloat("mean"),
                resultSet.getFloat("lower"),
                resultSet.getFloat("upper")
            )
            list.add(row)
        }
        return list
    }

    @Suppress("SwallowedException")
    private fun getDataFromConnection(conn: Connection): List<Map<CalibrateResultRowKeys, Any>> {
        try {
            val query = DEFAULT_QUERY
            val stmt: Statement = conn.createStatement()
            val resultSet = stmt.executeQuery(query)
            val arrayList = convertToArrayList(resultSet)
            return arrayList.map { row ->
                row.toMap()
            }
        } catch (e: SQLException) {
            throw CalibrateDataException("Could not execute query")
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

    override fun getDataFromPath(path: String): JSONArray
    {
        getDBConnFromPathResponse(path).use { conn ->
            val plotData = getDataFromConnection(conn)
            return JSONArray(plotData)
        }
    }
}
