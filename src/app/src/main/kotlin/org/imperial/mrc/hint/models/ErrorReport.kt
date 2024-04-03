package org.imperial.mrc.hint.models

data class ErrorReport(
    var email: String,
    val country: String,
    val projectName: String,
    val section: String,
    val modelRunId: String,
    val calibrateId: String,
    val downloadIds: Map<String, String>,
    val errors: List<Errors>,
    val description: String,
    val stepsToReproduce: String,
    val browserAgent: String,
    val versions: Map<String, String>,
    val timeStamp: String
)

data class Errors(val detail: String? = "", val error: String? = "", val key: String? = "")
