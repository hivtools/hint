package org.imperial.mrc.hint.models

import com.fasterxml.jackson.annotation.JsonProperty

data class CalibrateResultRow(
    val indicator: String,
    @field:JsonProperty("calendar_quarter")
    val calendarQuarter: String,
    @field:JsonProperty("age_group")
    val ageGroup: String,
    val sex: String,
    @field:JsonProperty("area_id")
    val areaId: String,
    val mode: Number,
    val mean: Number,
    val lower: Number,
    val upper: Number,
    @field:JsonProperty("area_level")
    val areaLevel: Int)

data class FilterQuery(
    val indicator: List<String>,
    @field:JsonProperty("calendar_quarter")
    val calendarQuarter: List<String>,
    @field:JsonProperty("age_group")
    val ageGroup: List<String>,
    val sex: List<String>,
    @field:JsonProperty("area_id")
    val areaId: List<String>,
    @field:JsonProperty("area_level")
    val areaLevel: List<Int>)
{
    operator fun iterator(): Iterator<Pair<String, List<Any>>>
    {
        return listOf(
            "indicator" to indicator,
            "calendar_quarter" to calendarQuarter,
            "age_group" to ageGroup,
            "sex" to sex,
            "area_id" to areaId,
            "area_level" to areaLevel
        ).iterator()
    }
}
