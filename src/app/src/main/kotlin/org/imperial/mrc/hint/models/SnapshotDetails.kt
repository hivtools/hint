package org.imperial.mrc.hint.models

data class SnapshotDetails(val state: String, val files: Map<String, SnapshotFile>)
