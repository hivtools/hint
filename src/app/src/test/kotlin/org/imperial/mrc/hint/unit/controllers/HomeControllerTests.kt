package org.imperial.mrc.hint.unit.controllers

import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import org.assertj.core.api.AssertionsForClassTypes.assertThat
import org.imperial.mrc.hint.clients.HintrAPIClient
import org.imperial.mrc.hint.controllers.HomeController
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity

class HomeControllerTests
{
    private val fakeAPIResponseBody = "{\"status\":\"success\",\"errors\":null," +
            "\"data\":{\"chocolatey_whippet_2\":\"IDLE\",\"chocolatey_whippet_1\":\"IDLE\"," +
            "\"chocolatey_whippet_3\":\"PAUSED\", \"chocolatey_whippet_4\":\"EXITED\"}}"

    @Test
    fun `gets metrics for each worker status type`()
    {
        val mockAPIClient = mock<HintrAPIClient> {
            on { get("hintr/worker/status") } doReturn ResponseEntity(fakeAPIResponseBody, HttpStatus.OK)
        }
        val sut = HomeController(mock(), mock(), mock(), mockAPIClient)
        val result = sut.metrics()
        assertThat(result.body)
                .isEqualTo("running 1\nbusy_workers 0\nidle_workers 2" +
                        "\npaused_workers 1\nexited_workers 1\nlost_workers 0")
    }
}