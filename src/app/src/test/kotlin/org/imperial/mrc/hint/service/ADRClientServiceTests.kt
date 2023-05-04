package org.imperial.mrc.hint.service

import com.nhaarman.mockito_kotlin.*
import org.imperial.mrc.hint.clients.ADRClientBuilder
import org.assertj.core.api.AssertionsForInterfaceTypes.assertThat
import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.clients.ADRClient
import org.junit.jupiter.api.Test
import org.mockito.ArgumentMatchers.anyString
import org.springframework.http.ResponseEntity

class ADRClientServiceTests
{
    private val mockAdrActivityResponse = mock<ResponseEntity<String>> {
        on { body } doReturn """{"data": [{"id": "3"}]}"""
    }

    @Test
    fun `can build sso client`()
    {
        val mockProperties = mock<AppProperties> {
            on { oauth2LoginMethod } doReturn true
        }

        val mockClient = mock<ADRClient> {
            on { get(anyString()) } doReturn mockAdrActivityResponse
        }

        val mockBuilder = mock<ADRClientBuilder> {
            on { build() } doReturn mockClient
            on { buildSSO() } doReturn mockClient
        }

        val sut = ADRClientService(mockBuilder, mockProperties)

        val result = sut.build()

        verify(mockBuilder).buildSSO()

        verifyNoMoreInteractions(mockBuilder)

        assertThat(result).isInstanceOf(ADRClient::class.java)
    }

    @Test
    fun `can build basic client`()
    {
        val mockProperties = mock<AppProperties> {
            on { oauth2LoginMethod } doReturn false
        }

        val mockClient = mock<ADRClient> {
            on { get(anyString()) } doReturn mockAdrActivityResponse
        }

        val mockBuilder = mock<ADRClientBuilder> {
            on { build() } doReturn mockClient
            on { buildSSO() } doReturn mockClient
        }

        val sut = ADRClientService(mockBuilder, mockProperties)

        val result = sut.build()

        verify(mockBuilder).build()

        verifyNoMoreInteractions(mockBuilder)

        assertThat(result).isInstanceOf(ADRClient::class.java)
    }
}
