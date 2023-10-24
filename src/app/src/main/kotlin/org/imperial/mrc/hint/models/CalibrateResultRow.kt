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
    val upper: Number)
