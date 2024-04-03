package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.clients.FuelFlowClient
import org.imperial.mrc.hint.logging.GenericLoggerImpl
import org.imperial.mrc.hint.models.ErrorReport
import org.imperial.mrc.hint.service.ProjectVersionService
import org.slf4j.LoggerFactory
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
class ErrorReportController(
    private val fuelFlowClient: FuelFlowClient,
    private val projectVersionService: ProjectVersionService
)
{
    private val logger = GenericLoggerImpl(LoggerFactory.getLogger(ErrorReportController::class.java))

    @PostMapping("/error-report")
    @ResponseBody
    fun postErrorReport(@RequestParam("projectId") projectId: Int,
                        @RequestBody errorReport: ErrorReport): ResponseEntity<String>
    {

        logger.info(
            "Creating error report",
            mapOf(
                "projectId" to projectId,
                "user" to errorReport.email))
        val teamsRes = fuelFlowClient.notifyTeams(errorReport)
        if (!teamsRes.statusCode.isError) {
            projectVersionService.cloneProjectToUser(
                projectId,
                listOf("test.user@example.com")
            )
        } else {
            logger.info(
                "Failed to create error report",
                mapOf(
                    "projectId" to projectId,
                    "user" to errorReport.email))
        }
        return teamsRes
    }
}
