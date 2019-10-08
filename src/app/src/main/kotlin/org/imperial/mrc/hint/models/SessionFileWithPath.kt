package org.imperial.mrc.hint.models

data class SessionFile(val hash: String, val filename: String) {
    fun toSessionFileWithPath(pathDirectory: String): SessionFileWithPath {
        return SessionFileWithPath("$pathDirectory/$hash", hash, filename)
    }
}

data class SessionFileWithPath(val path: String, val hash: String, val filename: String)
