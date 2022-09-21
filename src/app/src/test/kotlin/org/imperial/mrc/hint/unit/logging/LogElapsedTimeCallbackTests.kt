package org.imperial.mrc.hint.unit.logging

import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import com.nhaarman.mockito_kotlin.verify
import org.imperial.mrc.hint.clients.FuelClient
import org.imperial.mrc.hint.logging.GenericLogger
import org.imperial.mrc.hint.logging.logDurationOfResponseEntityRequests
import org.imperial.mrc.hint.logging.logDurationOfStreamRequests
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.mockito.ArgumentMatchers.anyString
import org.mockito.ArgumentMatchers.contains
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import java.io.BufferedInputStream
import java.io.ByteArrayInputStream

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
        val result = logDurationOfResponseEntityRequests({ mockFuelClient.get("url") }, mockLogger)
        assertEquals(result.statusCode, HttpStatus.OK)
        assertEquals(result.body, "test")
        verify(mockLogger).info(contains("ADR request time elapsed: "))
    }

    @Test
    fun `callback request can return BufferedStream`()
    {
        val anyInputStream = ByteArrayInputStream("test data".toByteArray())
        val result = logDurationOfStreamRequests({ BufferedInputStream(anyInputStream) }, mockLogger)
        assertEquals(result.readAllBytes().decodeToString(), "test data")
        verify(mockLogger).info(contains("ADR request time elapsed: "))
    }
}