package org.imperial.mrc.hint.models

data class SnapshotFile(val hash: String, val filename: String, val fromADR: Boolean) {
    fun toSnapshotFileWithPath(pathDirectory: String): SnapshotFileWithPath {
        return SnapshotFileWithPath("$pathDirectory/$hash", hash, filename, fromADR)
    }
}

data class SnapshotFileWithPath(val path: String, val hash: String, val filename: String, val fromADR: Boolean)
