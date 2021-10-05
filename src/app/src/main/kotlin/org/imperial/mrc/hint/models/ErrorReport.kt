package org.imperial.mrc.hint.models

import java.time.Instant

data class ErrorReport(
        val email: String,
        val country: String? = "",
        val projectName: String,
        val section: String,
        val errors: List<Errors>,
        val description: String? = "",
        val stepsToReproduce: String? = "",
        val browserAgent: String,
        val timeStamp: Instant? = Instant.now()
)

data class Errors(val jobId: String? = "", val errorMessage: String? = "")
