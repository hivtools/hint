package org.imperial.mrc.hint.integration

import org.imperial.mrc.hint.helpers.getTestEntity
import org.junit.jupiter.api.Test
import org.springframework.boot.test.web.client.exchange
import org.springframework.boot.test.web.client.getForEntity
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.http.HttpStatus

class TranslationTests : SecureIntegrationTests() {

    @Test
    fun `returns translated error message when accept language is fr`() {
        authorize()
        testRestTemplate.getForEntity<String>("/")
        val headers = HttpHeaders()
        headers.set("Accept-Language", "fr")
        val postEntity = HttpEntity(getTestEntity("malawi.geojson").body, headers)

        val responseEntity = testRestTemplate.exchange<String>("/baseline/pjnz/", HttpMethod.POST, postEntity)

        assertSecureWithError(IsAuthorized.TRUE,
                responseEntity,
                HttpStatus.BAD_REQUEST,
                "INVALID_FILE",
                "Le fichier doit être d'un type PJNZ, zip, mais reçu geojson,geojson,geojson")
    }
}