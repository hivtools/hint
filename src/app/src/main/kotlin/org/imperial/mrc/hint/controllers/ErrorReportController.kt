package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.clients.FuelFlowClient
import org.imperial.mrc.hint.logging.GenericLoggerImpl
import org.imperial.mrc.hint.models.ErrorReport
import org.imperial.mrc.hint.service.ProjectService
import org.slf4j.LoggerFactory
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.ResponseBody
import org.springframework.web.bind.annotation.RestController

@RestController
class ErrorReportController(
    private val fuelFlowClient: FuelFlowClient,
    private val projectService: ProjectService,
    private val appProperties: AppProperties,
)
{
    private val logger = GenericLoggerImpl(LoggerFactory.getLogger(ErrorReportController::class.java))

    @PostMapping("/error-report")
    @ResponseBody
    fun postErrorReport(@RequestBody errorReport: ErrorReport): ResponseEntity<String>
    {

        val logDetails = mapOf(
            "projectId" to errorReport.projectId,
            "user" to errorReport.email)
        logger.info("Creating error report", logDetails)
        val teamsRes = fuelFlowClient.notifyTeams(errorReport)
        if (!teamsRes.statusCode.isError)
        {
            if (errorReport.projectId != null && errorReport.email != appProperties.supportEmail)
            {
                projectService.cloneProjectToUser(
                    errorReport.projectId,
                    listOf(appProperties.supportEmail)
                )
            }
        }
        else
        {
            logger.info("Failed to create error report", logDetails)
        }
        return teamsRes
    }
}
