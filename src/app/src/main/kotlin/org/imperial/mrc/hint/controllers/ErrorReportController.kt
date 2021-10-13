package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.clients.FlowClient
import org.imperial.mrc.hint.models.ErrorReport
import org.springframework.http.*
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.ResponseBody
import org.springframework.web.bind.annotation.RestController

@RestController
class ErrorReportController(private val appProperties: AppProperties, private val flowClient: FlowClient)
{
    @PostMapping("/error-report")
    @ResponseBody
    fun postErrorReport(@RequestBody errorReport: ErrorReport): ResponseEntity<String>
    {
        return flowClient.notifyTeams(appProperties.issueReportUrl, errorReport)
    }
}
