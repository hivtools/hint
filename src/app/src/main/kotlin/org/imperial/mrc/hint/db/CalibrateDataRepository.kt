package org.imperial.mrc.hint.db

import org.jooq.tools.json.JSONArray
import org.springframework.stereotype.Component
import org.imperial.mrc.hint.models.CalibrateResultRow
import org.imperial.mrc.hint.models.FilterQuery
import java.sql.Connection
import java.sql.DriverManager
import java.sql.Statement
import java.util.Properties
import java.sql.ResultSet
import java.sql.SQLException
import java.sql.PreparedStatement

const val FILTER_TEMPLATE = """SELECT
age_group,area_id,
calendar_quarter,
indicator,
ROUND(lower, 4) AS lower,
ROUND(mean, 4) AS mean,
ROUND(mode, 4) AS mode,
sex,
ROUND(upper, 4) AS upper,
area_level,
FROM data WHERE 
"""

interface CalibrateDataRepository
{
    fun getFilteredCalibrateData(
        path: String,
        data: FilterQuery): List<CalibrateResultRow>
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
                        it.getFloat("upper"),
                        it.getInt("area_level")
                    )
                } else {
                    null
                }
            }.toList()
        }
    }

    @Suppress("MagicNumber")
    private fun getFilteredDataFromConnection(
        conn: Connection,
        filterQuery: FilterQuery): List<CalibrateResultRow> {
        val resultSet: ResultSet
        var query = FILTER_TEMPLATE

        for ((field, values) in filterQuery) {
            if (values.size > 0) {
                val questionMarks = values.map { "?" }.joinToString(",")
                query += "$field IN ($questionMarks) AND "
            }
        }
        query = query.dropLast(5)

        val stmt: PreparedStatement = conn.prepareStatement(query)
        var stmtIndex = 1;
        for ((_, values) in filterQuery) {
            values.forEach { it ->
                if (it is String) {
                    stmt.setString(stmtIndex, it)
                } else if (it is Int) {
                    stmt.setInt(stmtIndex, it)
                }
                stmtIndex++
            }
        }

        resultSet = stmt.executeQuery()
        val arrayList = convertDataToArrayList(resultSet)
        return arrayList
    }

    private fun getDBConnFromPathResponse(path: String): Connection {   
        val readOnlyProp = Properties()
        readOnlyProp.setProperty("duckdb.read_only", "true")
        val conn = DriverManager.getConnection("jdbc:duckdb:.${path}", readOnlyProp)
        return conn
    }

    override fun getFilteredCalibrateData(
        path: String,
        data: FilterQuery): List<CalibrateResultRow>
    {
        getDBConnFromPathResponse(path).use { conn ->
            return getFilteredDataFromConnection(conn, data)
        }
    }
}
