package org.imperial.mrc.hint.unit.model

import org.junit.jupiter.api.Test
import org.imperial.mrc.hint.models.CalibrateResultRow
import org.imperial.mrc.hint.models.FilterQuery
import com.fasterxml.jackson.databind.ObjectMapper

class CalibrateResultRowTests
{
    val expectedJsonMap = mapOf(
        "indicator" to "indicator_test",
        "calendar_quarter" to "calendar_quarter_test",
        "age_group" to "age_group_test",
        "sex" to "sex_test",
        "area_id" to "area_id_test",
        "mean" to 1, "upper" to 1,
        "mode" to 1, "lower" to 1,
        "area_level" to 1
    )
    val expectedJsonString = ObjectMapper().writeValueAsString(expectedJsonMap)
    val expectedJson = ObjectMapper().readTree(expectedJsonString)

    @Test
    fun `result row serialises with correct json keys`()
    {
        val row = CalibrateResultRow(
            "indicator_test",
            "calendar_quarter_test",
            "age_group_test",
            "sex_test",
            "area_id_test",
            1, 1, 1, 1, 1
        )
        val jsonRow = ObjectMapper().writeValueAsString(row)
        val json = ObjectMapper().readTree(jsonRow)
        assert(json.equals(expectedJson))
    }

    @Test
    fun `filter query iterator works as expected`()
    {
        val filterQuery = FilterQuery(
            listOf("ind1", "ind2"),
            listOf("cal1"),
            listOf("age1"),
            listOf("sex1", "sex2", "sex3"),
            listOf("area1"),
            listOf(1, 2, 3, 4)
        )
        val expectedList = listOf(
            listOf("indicator", listOf("ind1", "ind2")),
            listOf("calendar_quarter", listOf("cal1")),
            listOf("age_group", listOf("age1")),
            listOf("sex", listOf("sex1", "sex2", "sex3")),
            listOf("area_id", listOf("area1")),
            listOf("area_level", listOf(1, 2, 3, 4))
        )
        var i = 0
        for ((field, values) in filterQuery) {
            assert(field == expectedList[i][0])
            assert(values == expectedList[i][1])
            i++
        }
    }
}