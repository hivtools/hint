package org.imperial.mrc.hint.unit.logging

import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import com.nhaarman.mockito_kotlin.verify
import org.imperial.mrc.hint.clients.ADRClient
import org.imperial.mrc.hint.clients.FuelClient
import org.imperial.mrc.hint.logging.GenericLogger
import org.imperial.mrc.hint.logging.logADRRequestDuration
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.mockito.ArgumentMatchers.anyString
import org.mockito.ArgumentMatchers.contains
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import java.io.ByteArrayInputStream
import java.io.InputStream
import java.net.URI
import java.net.http.HttpResponse

class LogElapsedTimeCallbackTests
{
    private val mockLogger = mock<GenericLogger>()

    @Test
    fun `callback request can write log and return responseEntity`()
    {
        val mockResponse = ResponseEntity.ok().body("test")
        val mockFuelClient = mock<FuelClient> {
            on { get(anyString()) } doReturn mockResponse
        }
        val result = logADRRequestDuration({ mockFuelClient.get("url") }, mockLogger)
        assertEquals(result.statusCode, HttpStatus.OK)
        assertEquals(result.body, "test")
        verify(mockLogger).info(contains("ADR request time elapsed: "))
    }

    @Test
    fun `callback request can return HttpResponse`()
    {
        val anyInputStream = ByteArrayInputStream("test data".toByteArray())

        val mockHttpResponse = mock<HttpResponse<InputStream>> {
            on { body() } doReturn anyInputStream
            on { statusCode() } doReturn 200
            on { uri() } doReturn URI("http://test.url")
        }

        val mockADRClient = mock<ADRClient> {
            on { getInputStream(anyString()) } doReturn mockHttpResponse
        }

        val result = logADRRequestDuration({ mockADRClient.getInputStream("url") }, mockLogger)

        assertEquals(result.statusCode(), 200)

        assertEquals(result.uri(), URI("http://test.url"))

        assertEquals(result.body().bufferedReader().use { it.readText() }, "test data")

        verify(mockLogger).info(contains("ADR request time elapsed: "))
    }
}
