package org.imperial.mrc.hint.models

data class ErrorReport(
        val email: String,
        val country: String? = "",
        val projectName: String? = "",
        val section: String,
        val jobId: String? = "",
        val errors: List<Errors>,
        val description: String? = "",
        val stepsToReproduce: String? = "",
        val browserAgent: String,
        val timeStamp: String
)

data class Errors(val detail: String? = "", val error: String? = "", val key: String? = "")
