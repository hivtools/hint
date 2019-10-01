package org.imperial.mrc.hint.unit.controllers

import com.nhaarman.mockito_kotlin.*
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.APIClient
import org.imperial.mrc.hint.controllers.MetadataController
import org.junit.jupiter.api.Test
import org.springframework.http.ResponseEntity

abstract class MetadataControllerTests {

    @Test
    fun `gets plotting metada`() {
        val mockResponse = mock<ResponseEntity<String>>()
        val mockAPIClient = mock<APIClient>{
            on {getPlottingMetadata("Malawi")} doReturn mockResponse
        }

        val sut = MetadataController(mockAPIClient)
        val result = sut.plotting("Malawi")
        assertThat(result).isSameAs(mockResponse)

    }
}