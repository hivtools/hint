package org.imperial.mrc.hint.controllers

import com.fasterxml.jackson.databind.ObjectMapper
import org.imperial.mrc.hint.models.EmptySuccessResponse
import org.imperial.mrc.hint.models.ErrorReport
import org.imperial.mrc.hint.models.asResponseEntity
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
class ErrorReportController(private val objectMapper: ObjectMapper)
{
    @PostMapping("/error-report")
    @ResponseBody
    fun sendErrorReport(@RequestBody errorReport: ErrorReport): ResponseEntity<String>
    {
        val errorReportJson = objectMapper.writeValueAsString(errorReport)

        //post errorReportJson to webhook
        val postErrorReport = ResponseEntity.ok().build<String>()

        if(postErrorReport.statusCode == HttpStatus.OK){
            return ResponseEntity.badRequest().build()
        }

        return EmptySuccessResponse.asResponseEntity()
    }
}