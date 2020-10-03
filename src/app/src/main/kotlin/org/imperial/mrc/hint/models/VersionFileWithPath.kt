package org.imperial.mrc.hint.models

data class VersionFile(val hash: String, val filename: String, val fromADR: Boolean)
{
    fun toVersionFileWithPath(pathDirectory: String): VersionFileWithPath
    {
        return VersionFileWithPath("$pathDirectory/$hash", hash, filename, fromADR)
    }
}

data class VersionFileWithPath(val path: String, val hash: String, val filename: String, val fromADR: Boolean)
