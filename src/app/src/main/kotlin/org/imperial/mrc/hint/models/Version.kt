package org.imperial.mrc.hint.models

import java.sql.Timestamp
import java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME

data class Version(val id: Int, val name: String, val snapshots: List<Snapshot>)

private val formatter = ISO_LOCAL_DATE_TIME
data class Snapshot(val id: String, val created: String, val updated: String) {
    constructor(id: String, created: Timestamp, updated: Timestamp):
            this(id, formatter.format(created.toLocalDateTime()), formatter.format(updated.toLocalDateTime()))
}
