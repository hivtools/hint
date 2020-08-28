package org.imperial.mrc.hint.models

data class VersionFile(val hash: String, val filename: String) {
    fun toVersionFileWithPath(pathDirectory: String): VersionFileWithPath {
        return VersionFileWithPath("$pathDirectory/$hash", hash, filename)
    }
}

data class VersionFileWithPath(val path: String, val hash: String, val filename: String)
