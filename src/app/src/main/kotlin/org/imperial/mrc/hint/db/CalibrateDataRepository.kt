package org.imperial.mrc.hint.db

import org.jooq.tools.json.JSONArray
import org.springframework.stereotype.Component
import org.imperial.mrc.hint.models.CalibrateResultRow
import java.sql.Connection
import java.sql.DriverManager
import java.sql.Statement
import java.util.Properties
import java.sql.ResultSet

const val INDICATOR_QUERY = """
SELECT DISTINCT indicator FROM data
"""

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
    fun getDataFromPath(
        path: String,
        indicator: String): List<CalibrateResultRow>
}

@Component
class JooqCalibrateDataRepository: CalibrateDataRepository
{

    private fun convertDataToArrayList(resultSet: ResultSet): List<CalibrateResultRow> {
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

    private fun convertIndicatorToList(resultSet: ResultSet): List<String> {
        resultSet.use {
            return generateSequence {
                if (it.next()) {
                    it.getString("indicator")
                } else {
                    null
                }
            }.toList()
        }
    }

    private fun getIndicatorQuery(indicator: String): String {
        return """SELECT
        age_group,area_id,
        calendar_quarter,
        indicator,
        ROUND(lower, 4) AS lower,
        ROUND(mean, 4) AS mean,
        ROUND(mode, 4) AS mode,
        sex,
        ROUND(upper, 4) AS upper
        FROM data WHERE indicator='$indicator'"""
    }

    private fun getDataFromConnection(
        conn: Connection,
        indicator: String): List<CalibrateResultRow> {
        val query: String
        if (indicator == "all") {
            query = DEFAULT_QUERY
        } else {
            val indicatorStmt: Statement = conn.createStatement()
            val indicatorResultSet = indicatorStmt.executeQuery(INDICATOR_QUERY)
            val validIndicators = convertIndicatorToList(indicatorResultSet)
            if (indicator in validIndicators) {
                query = getIndicatorQuery(indicator)
            } else {
                throw Exception("Invalid indicator selection")
            }
        }
        val stmt: Statement = conn.createStatement()
        val resultSet = stmt.executeQuery(query)
        val arrayList = convertDataToArrayList(resultSet)
        return arrayList
    }

    private fun getDBConnFromPathResponse(path: String): Connection {   
        val readOnlyProp = Properties()
        readOnlyProp.setProperty("duckdb.read_only", "true")
        val conn = DriverManager.getConnection("jdbc:duckdb:.${path}", readOnlyProp)
        return conn
    }

    override fun getDataFromPath(
        path: String,
        indicator: String): List<CalibrateResultRow>
    {
        getDBConnFromPathResponse(path).use { conn ->
            return getDataFromConnection(conn, indicator)
        }
    }
}
