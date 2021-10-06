package org.imperial.mrc.hint.integration

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.boot.test.web.client.postForEntity
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType

class ErrorReportTests : SecureIntegrationTests()
{
    @Test
    fun `can post error report`()
    {
        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_JSON

        val data = """                    
             {
             "email":"test.user@example.com",
             "country":"South Africa",
             "projectName":"South 2 Worldpop",
             "section":"Fit model",
             "errors":[
             {
             "jobId":"y65ae0d095ea3ca450c1511f08acc62f51",
             "errorMessage":"Error simulating output for indicator anc_plhiv_t2_out. Please contact support for troubleshooting1"
             }
             ],
             "description":"description of the error msg",
             "stepsToReproduce":"",
             "browserAgent":"Mozilla/5.0 (Linux; Android 8.0.0; SM-G960F Build/R16NW)"
             }
        """.trimIndent()

        val httpEntity = HttpEntity(data, headers)
        val responseEntity = testRestTemplate.postForEntity<String>("/error-report", httpEntity)

        assertThat(responseEntity.statusCode).isEqualTo(HttpStatus.OK)
    }

}