package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.clients.FuelFlowClient
import org.imperial.mrc.hint.logging.GenericLoggerImpl
import org.imperial.mrc.hint.models.ErrorReport
import org.imperial.mrc.hint.service.ProjectVersionService
import org.slf4j.LoggerFactory
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.*

@RestController
class ErrorReportController(
    private val fuelFlowClient: FuelFlowClient,
    private val projectVersionService: ProjectVersionService,
    private val appProperties: AppProperties,
)
{
    private val logger = GenericLoggerImpl(LoggerFactory.getLogger(ErrorReportController::class.java))

    @PostMapping("/error-report")
    @ResponseBody
    fun postErrorReport(@RequestBody errorReport: ErrorReport,
                        @RequestParam("projectId", required = false) projectId: Optional<Int>
    ): ResponseEntity<String>
    {

        logger.info(
            "Creating error report",
            mapOf(
                "projectId" to projectId.orElse(null),
                "user" to errorReport.email))
        val teamsRes = fuelFlowClient.notifyTeams(errorReport)
        if (!teamsRes.statusCode.isError)
        {
            if (projectId.isPresent && errorReport.email != appProperties.supportEmail)
            {
                projectVersionService.cloneProjectToUser(
                    projectId.orElse(null),
                    listOf(appProperties.supportEmail)
                )
            }
        }
        else
        {
            logger.info(
                "Failed to create error report",
                mapOf(
                    "projectId" to projectId.orElse(null),
                    "user" to errorReport.email))
        }
        return teamsRes
    }
}
