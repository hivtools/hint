package org.imperial.mrc.hint.controllers

import com.fasterxml.jackson.databind.ObjectMapper
import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.models.EmptySuccessResponse
import org.imperial.mrc.hint.models.ErrorReport
import org.imperial.mrc.hint.models.asResponseEntity
import org.springframework.http.*
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.ResponseBody
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.client.RestTemplate
import org.springframework.web.client.postForEntity


@RestController
class ErrorReportController(
        private val objectMapper: ObjectMapper,
        private val restTemplate: RestTemplate,
        private val appProperties: AppProperties)
{
    @PostMapping("/error-report")
    @ResponseBody
    fun postErrorReport(@RequestBody errorReport: ErrorReport): ResponseEntity<String>
    {
        val response = notifyTeams(errorReport)

        if (response.statusCode != HttpStatus.OK)
        {
            return ResponseEntity.status(response.statusCode).build()
        }

        return EmptySuccessResponse.asResponseEntity()
    }

    fun notifyTeams(errorReport: ErrorReport): ResponseEntity<String>
    {
        val errorReportJson = objectMapper.writeValueAsString(errorReport)

        val headers = HttpHeaders()

        headers.contentType = MediaType.APPLICATION_JSON

        val httpEntity = HttpEntity(errorReportJson, headers)

        val url = appProperties.issueReportUrl

        return restTemplate.postForEntity(url, httpEntity)
    }
}
