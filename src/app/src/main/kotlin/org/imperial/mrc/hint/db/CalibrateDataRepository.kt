package org.imperial.mrc.hint.db

import org.imperial.mrc.hint.models.CalibrateResultRow
import org.imperial.mrc.hint.models.FilterQuery
import org.imperial.mrc.hint.models.ResultData
import org.jooq.tools.jdbc.SingleConnectionDataSource
import org.ktorm.database.Database
import org.ktorm.database.use
import org.ktorm.dsl.*
import org.ktorm.schema.Column
import org.ktorm.schema.ColumnDeclaring
import org.springframework.stereotype.Component
import java.nio.file.Path
import java.sql.*
import java.util.*

const val INDICATOR_QUERY = """SELECT
age_group,area_id,
calendar_quarter,
indicator,
ROUND(lower, 4) AS lower,
ROUND(mean, 4) AS mean,
ROUND(mode, 4) AS mode,
sex,
ROUND(upper, 4) AS upper,
area_level,
FROM data WHERE indicator=?"""

const val DEFAULT_QUERY = """SELECT
age_group,area_id,
calendar_quarter,
indicator,
ROUND(lower, 4) AS lower,
ROUND(mean, 4) AS mean,
ROUND(mode, 4) AS mode,
sex,
ROUND(upper, 4) AS upper,
area_level,
FROM data"""

interface CalibrateDataRepository {
    fun getDataFromPath(
        path: Path,
        indicator: String
    ): List<CalibrateResultRow>

    fun getFilteredCalibrateData(
        path: Path,
        filterQuery: FilterQuery
    ): List<CalibrateResultRow>
}

@Component
class JooqCalibrateDataRepository : CalibrateDataRepository {

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

    private fun getDataFromConnection(
        conn: Connection,
        indicator: String
    ): List<CalibrateResultRow> {
        val resultSet: ResultSet
        if (indicator == "all") {
            val query = DEFAULT_QUERY
            val stmt: Statement = conn.createStatement()
            resultSet = stmt.executeQuery(query)
        } else {
            val stmt: PreparedStatement = conn.prepareStatement(INDICATOR_QUERY)
            stmt.setString(1, indicator)
            resultSet = stmt.executeQuery()
        }

        val arrayList = convertDataToArrayList(resultSet)
        return arrayList
    }

    // Ktorm doesn't have a nullable type :( so we have to use the unsafe
    @Suppress("UnsafeCallOnNullableType")
    private fun getFilteredDataFromConnection(
        conn: Connection,
        filterQuery: FilterQuery
    ): List<CalibrateResultRow> {
        val dataSource = SingleConnectionDataSource(conn)
        return Database.connect(dataSource)
            .from(ResultData)
            .select()
            .whereWithConditions { it ->
                conditionalAddWhere(it, filterQuery.indicator, ResultData.indicator)
                conditionalAddWhere(it, filterQuery.calendarQuarter, ResultData.calendarQuarter)
                conditionalAddWhere(it, filterQuery.ageGroup, ResultData.ageGroup)
                conditionalAddWhere(it, filterQuery.sex, ResultData.sex)
                conditionalAddWhere(it, filterQuery.areaId, ResultData.areaId)
                conditionalAddWhere(it, filterQuery.areaLevel?.map { it.toInt() }, ResultData.areaLevel)
            }
            .map { it ->
                CalibrateResultRow(
                    it[ResultData.indicator]!!,
                    it[ResultData.calendarQuarter]!!,
                    it[ResultData.ageGroup]!!,
                    it[ResultData.sex]!!,
                    it[ResultData.areaId]!!,
                    it[ResultData.mode]!!,
                    it[ResultData.mean]!!,
                    it[ResultData.lower]!!,
                    it[ResultData.upper]!!,
                    it[ResultData.areaLevel]!!,
                )
            }
    }

    private fun getDBConnFromPathResponse(path: Path): Connection {
        val readOnlyProp = Properties()
        readOnlyProp.setProperty("duckdb.read_only", "true")
        val conn = DriverManager.getConnection("jdbc:duckdb:${path.toRealPath()}", readOnlyProp)
        return conn
    }

    private fun <T : Any> conditionalAddWhere(
        conditions: MutableList<ColumnDeclaring<Boolean>>,
        queryCondition: List<T>?,
        column: Column<T>
    ) {
        if (queryCondition != null) {
            conditions += column inList queryCondition
        }
    }

    override fun getDataFromPath(
        path: Path,
        indicator: String
    ): List<CalibrateResultRow> {
        getDBConnFromPathResponse(path).use { conn ->
            return getDataFromConnection(conn, indicator)
        }
    }

    @Suppress("ReturnCount")
    override fun getFilteredCalibrateData(
        path: Path,
        filterQuery: FilterQuery
    ): List<CalibrateResultRow> {
        if (filterQuery.indicator != null && filterQuery.indicator.size == 0) {
            return listOf()
        }
        if (filterQuery.calendarQuarter != null && filterQuery.calendarQuarter.size == 0) {
            return listOf()
        }
        if (filterQuery.ageGroup != null && filterQuery.ageGroup.size == 0) {
            return listOf()
        }
        if (filterQuery.sex != null && filterQuery.sex.size == 0) {
            return listOf()
        }
        if (filterQuery.areaId != null && filterQuery.areaId.size == 0) {
            return listOf()
        }
        if (filterQuery.areaLevel != null && filterQuery.areaLevel.size == 0) {
            return listOf()
        }
        getDBConnFromPathResponse(path).use { conn ->
            return getFilteredDataFromConnection(conn, filterQuery)
        }
    }
}
