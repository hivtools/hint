package org.imperial.mrc.hint.database

import org.springframework.test.context.ActiveProfiles
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.transaction.annotation.Transactional
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.ResponseEntity
import org.imperial.mrc.hint.db.CalibrateDataRepository
import org.imperial.mrc.hint.exceptions.CalibrateDataException
import org.imperial.mrc.hint.models.CalibrateResultRow
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
    val expectedRow = JSONArray(listOf(CalibrateResultRow(
        "indicator_test",
        "calendar_quarter_test",
        "age_group_test",
        "sex_test",
        "area_id_test",
        0.2222,
        0.5555,
        0.1111,
        0.9999
    )))
    val path = "/src/test/resources/duckdb/test.duckdb"

    @Autowired
    private lateinit var sut: CalibrateDataRepository

    @Test
    fun `can get data from duckdb path`()
    {
        val plotData = sut.getDataFromPath(path)
        val plotDataTree = ObjectMapper().readTree(plotData.toString())
        val expectedTree = ObjectMapper().readTree(expectedRow.toString())
        assert(plotDataTree.equals(expectedTree))
    }

    @Test
    fun `throws error if connection is invalid`()
    {
        assertThatThrownBy {
            sut.getDataFromPath("/src/test/resources/duckdb/test1.duckdb")
        }.isInstanceOf(CalibrateDataException::class.java)
            .hasMessageContaining("databaseConnectionFailed")
    }
}