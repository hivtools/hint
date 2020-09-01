package org.imperial.mrc.hint.models

data class VersionDetails(val state: String, val files: Map<String, VersionFile>)
