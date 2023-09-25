package org.imperial.mrc.hint.unit

import org.junit.jupiter.api.Test
import org.springframework.http.ResponseEntity
import org.imperial.mrc.hint.getDBConnFromPathResponse
import org.imperial.mrc.hint.getDataFromQuery
import org.assertj.core.api.Assertions.assertThat
import org.jooq.tools.json.JSONArray
import org.jooq.tools.json.JSONObject
import org.skyscreamer.jsonassert.JSONAssert
import com.fasterxml.jackson.databind.ObjectMapper
import net.javacrumbs.jsonunit.assertj.JsonAssertions.assertThatJson;

class DuckDBUtilsTests
{
    val expectedDataObj = JSONObject(mapOf(
        "age_group" to "age_group_test",
        "area_id" to "area_id_test",
        "calendar_quarter" to "calendar_quarter_test",
        "indicator" to "indicator_test",
        "lower" to 0.1111f,
        "mean" to 0.5556f,
        "mode" to 0.2222f,
        "sex" to "sex_test",
        "upper" to 1.0f
    ))
    val expectedData = JSONArray(listOf(expectedDataObj))

    @Test
    fun `can get connection from path`()
    {
        val path = "/src/test/resources/duckdb/test.duckdb"
        val dataObj = JSONObject(mapOf(
            "path" to path
        ))
        val bodyObj = JSONObject(mapOf(
            "data" to dataObj
        ))
        val mockRes = ResponseEntity.ok(bodyObj.toString())
        val conn = getDBConnFromPathResponse(mockRes)
        assertThat(conn).isNotNull()
        conn?.close()
    }

    @Test
    fun `returns null for connection if path or data does not exist`()
    {
        val bodyObj = JSONObject(mapOf(
            "data" to ""
        ))
        val mockRes = ResponseEntity.ok("")
        val conn = getDBConnFromPathResponse(mockRes)
        assertThat(conn).isNull()
        conn?.close()
        val mockRes1 = ResponseEntity.ok(bodyObj.toString())
        val conn1 = getDBConnFromPathResponse(mockRes1)
        assertThat(conn1).isNull()
        conn1?.close()
    }

    @Test
    fun `can get data from duckdb file`()
    {
        val path = "/src/test/resources/duckdb/test.duckdb"
        val dataObj = JSONObject(mapOf(
            "path" to path
        ))
        val bodyObj = JSONObject(mapOf(
            "data" to dataObj
        ))
        val mockRes = ResponseEntity.ok(bodyObj.toString())
        val conn = getDBConnFromPathResponse(mockRes)
        val plotData = getDataFromQuery(conn!!, null)
        val plotDataTree = ObjectMapper().readTree(plotData!!.toString())
        val expectedDataTree = ObjectMapper().readTree(expectedData.toString())
        assert(plotDataTree.equals(expectedDataTree))
    }
}