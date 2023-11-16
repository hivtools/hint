package org.imperial.mrc.hint.unit.model

import org.junit.jupiter.api.Test
import org.imperial.mrc.hint.models.CalibrateResultRow
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
        "mode" to 1, "lower" to 1
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
            1, 1, 1, 1
        )
        val jsonRow = ObjectMapper().writeValueAsString(row)
        val json = ObjectMapper().readTree(jsonRow)
        assert(json.equals(expectedJson))
    }
}