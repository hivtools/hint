package org.imperial.mrc.hint.models

import java.time.Instant

data class ErrorReport(
        val email: String,
        val country: String? = null,
        val projectName: String,
        val section: String,
        val errors: List<Errors>,
        val description: String? = null,
        val stepsToReproduce: String? = null,
        val browserAgent: String,
        val timeStamp: Instant? = Instant.now()
)

data class Errors(val jobId: String? = null, val errorMessage: String? = null)
