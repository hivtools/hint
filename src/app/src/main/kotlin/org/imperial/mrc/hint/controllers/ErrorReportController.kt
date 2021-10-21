package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.clients.FuelFlowClient
import org.imperial.mrc.hint.models.ErrorReport
import org.springframework.http.*
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.ResponseBody
import org.springframework.web.bind.annotation.RestController

@RestController
class ErrorReportController(private val fuelFlowClient: FuelFlowClient)
{
    @PostMapping("/error-report")
    @ResponseBody
    fun postErrorReport(@RequestBody errorReport: ErrorReport): ResponseEntity<String>
    {
        return fuelFlowClient.notifyTeams(errorReport)
    }
}
