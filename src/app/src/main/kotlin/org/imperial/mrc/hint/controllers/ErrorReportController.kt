package org.imperial.mrc.hint.controllers

import com.fasterxml.jackson.databind.ObjectMapper
import org.imperial.mrc.hint.models.EmptySuccessResponse
import org.imperial.mrc.hint.models.ErrorReport
import org.imperial.mrc.hint.models.asResponseEntity
import org.springframework.http.*
import org.springframework.web.bind.annotation.*
import org.springframework.web.client.RestTemplate
import org.springframework.web.client.postForEntity

@RestController
class ErrorReportController(private val objectMapper: ObjectMapper)
{
    @PostMapping("/error-report")
    @ResponseBody
    fun postErrorReport(@RequestBody errorReport: ErrorReport): ResponseEntity<String>
    {
        val response = errorReport(errorReport)

        if (response.statusCode != HttpStatus.OK)
        {
            return ResponseEntity.status(response.statusCode).build()
        }

        return EmptySuccessResponse.asResponseEntity()
    }

    fun errorReport(errorReport: ErrorReport): ResponseEntity<String>
    {
        val errorReportJson = objectMapper.writeValueAsString(errorReport)

        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_JSON

        val httpEntity = HttpEntity(errorReportJson, headers)

        val url = "https://prod-58.westeurope.logic.azure.com:443/workflows/a13847fef9034c6099297b59490f8be2/triggers" +
                "/manual/paths/invoke?api-version=2016-06-01&sp=/triggers/manual/run&sv=1.0&sig" +
                "=cVhgcE7b75SnaFfLsYZBYHaSvBRFHLk4enyZ2H7yMj4"

        val restTemplate = RestTemplate()

        return restTemplate.postForEntity(url, httpEntity)
    }
}