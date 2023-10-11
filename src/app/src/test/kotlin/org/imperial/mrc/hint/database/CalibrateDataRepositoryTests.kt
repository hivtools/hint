package org.imperial.mrc.hint.database

import org.springframework.test.context.ActiveProfiles
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.transaction.annotation.Transactional
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.ResponseEntity
import org.imperial.mrc.hint.db.CalibrateDataRepository
import org.imperial.mrc.hint.exceptions.CalibrateDataException
import org.junit.jupiter.api.Test
import org.jooq.tools.json.JSONObject
import org.jooq.tools.json.JSONArray
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import com.fasterxml.jackson.databind.ObjectMapper

@ActiveProfiles(profiles = ["test"])
@SpringBootTest
class CalibrateDataRepositoryTests
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
    val expectedPlotData = JSONObject(mapOf("data" to expectedData))
    val path = "/src/test/resources/duckdb/test.duckdb"

    @Autowired
    private lateinit var sut: CalibrateDataRepository

    @Test
    fun `can get data from duckdb path`()
    {
        val plotData = sut.getDataFromPath(path)
        val plotDataTree = ObjectMapper().readTree(plotData.toString())
        val expectedPlotDataTree = ObjectMapper().readTree(expectedPlotData.toString())
        assert(plotDataTree.equals(expectedPlotDataTree))
    }

    @Test
    fun `throws error if connection is invalid`()
    {
        assertThatThrownBy {
            sut.getDataFromPath("/src/test/resources/duckdb/test1.duckdb")
        }.isInstanceOf(CalibrateDataException::class.java)
            .hasMessageContaining("Could not connect to database")
    }
}