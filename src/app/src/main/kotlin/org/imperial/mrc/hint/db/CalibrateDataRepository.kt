package org.imperial.mrc.hint.db

import org.jooq.tools.json.JSONArray
import org.springframework.stereotype.Component
import org.imperial.mrc.hint.exceptions.CalibrateDataException
import org.imperial.mrc.hint.models.CalibrateResultRow
import java.sql.Connection
import java.sql.DriverManager
import java.sql.Statement
import java.util.Properties
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

    private fun convertToArrayList(resultSet: ResultSet): List<CalibrateResultRow> {
            resultSet.use {
            return generateSequence {
                if (it.next()) {
                    CalibrateResultRow(
                        it.getString("indicator"),
                        it.getString("calendar_quarter"),
                        it.getString("age_group"),
                        it.getString("sex"),
                        it.getString("area_id"),
                        it.getFloat("mode"),
                        it.getFloat("mean"),
                        it.getFloat("lower"),
                        it.getFloat("upper")
                    )
                } else {
                    null
                }
            }.toList()
        }
    }

    @Suppress("SwallowedException")
    private fun getDataFromConnection(conn: Connection): List<CalibrateResultRow> {
        try {
            val query = DEFAULT_QUERY
            val stmt: Statement = conn.createStatement()
            val resultSet = stmt.executeQuery(query)
            val arrayList = convertToArrayList(resultSet)
            return arrayList
        } catch (e: SQLException) {
            throw CalibrateDataException("queryExecutionFailed")
        }
    }

    @Suppress("SwallowedException")
    private fun getDBConnFromPathResponse(path: String): Connection {   
        val readOnlyProp = Properties()
        readOnlyProp.setProperty("duckdb.read_only", "true")
        val conn = DriverManager.getConnection("jdbc:duckdb:.${path}", readOnlyProp)
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
