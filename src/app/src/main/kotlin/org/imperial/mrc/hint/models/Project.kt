package org.imperial.mrc.hint.models

import java.sql.Timestamp
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME

data class Project (
        val id: Int,
        val name: String,
        val versions: List<Version>,
        val sharedBy: String? = "",
        val note: String? = null,
        val isUploaded: Boolean? = false)

private val formatter = ISO_LOCAL_DATE_TIME

data class Version(
        val id: String,
        val created: String,
        val updated: String,
        val versionNumber: Int,
        val note: String? = null)
{
    constructor(id: String, created: LocalDateTime, updated: LocalDateTime, versionNumber: Int, note: String?)
            : this(id,
            formatter.format(created),
            formatter.format(updated),
            versionNumber,
            note)
}
