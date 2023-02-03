package org.imperial.mrc.hint.models

import com.fasterxml.jackson.annotation.JsonProperty

data class VersionFile(
    val hash: String,
    val filename: String,
    val fromAdr: Boolean,
    @field:JsonProperty("resource_url")
    val resourceUrl: String? = null)
{
    fun toVersionFileWithPath(pathDirectory: String): VersionFileWithPath
    {
        return VersionFileWithPath("$pathDirectory/$hash", hash, filename, fromAdr, resourceUrl)
    }
}
data class VersionFileWithPath(
    val path: String,
    val hash: String,
    val filename: String,
    val fromADR: Boolean,
    @field:JsonProperty("resource_url")
    val resourceUrl: String? = null
)
