package org.imperial.mrc.hint.models

enum class CalibrateResultRowKeys {
    INDICATOR, CALENDAR_QUARTER, AGE_GROUP,
    SEX, AREA_ID, MODE, MEAN, UPPER, LOWER;

    override fun toString(): String = name.lowercase()
}

data class CalibrateResultRow(val indicator: String,
                              val calendarQuarter: String,
                              val ageGroup: String,
                              val sex: String,
                              val areaId: String,
                              val mode: Number,
                              val mean: Number,
                              val lower: Number,
                              val upper: Number)
{
    fun toMap(): Map<CalibrateResultRowKeys, Any> {
        return mapOf(CalibrateResultRowKeys.INDICATOR to indicator,
                     CalibrateResultRowKeys.CALENDAR_QUARTER to calendarQuarter,
                     CalibrateResultRowKeys.AGE_GROUP to ageGroup,
                     CalibrateResultRowKeys.SEX to sex,
                     CalibrateResultRowKeys.AREA_ID to areaId,
                     CalibrateResultRowKeys.MODE to mode,
                     CalibrateResultRowKeys.MEAN to mean,
                     CalibrateResultRowKeys.LOWER to lower,
                     CalibrateResultRowKeys.UPPER to upper)
    }
}
