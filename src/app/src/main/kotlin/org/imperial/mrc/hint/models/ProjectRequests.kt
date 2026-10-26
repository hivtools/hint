package org.imperial.mrc.hint.models

data class NewProjectRequest(val name: String, val note: String? = null, val isUploaded: Boolean? = null)

data class CloneProjectRequest(val emails: List<String>)

data class NewVersionRequest(val parent: String, val note: String? = null)

data class PromoteVersionRequest(val name: String, val note: String? = null)

data class NoteRequest(val note: String)

data class RenameProjectRequest(val name: String, val note: String? = null)
