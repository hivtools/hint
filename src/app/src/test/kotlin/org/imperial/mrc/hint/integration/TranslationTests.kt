package org.imperial.mrc.hint.integration

import org.imperial.mrc.hint.helpers.getTestEntity
import org.junit.jupiter.api.Test
import org.springframework.boot.test.web.client.exchange
import org.springframework.boot.test.web.client.getForEntity
import org.springframework.boot.test.web.client.postForEntity
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.http.HttpStatus

class TranslationTests : SecureIntegrationTests() {

    @Test
    fun `gets translated error message when accept language is fr`() {
        authorize()
        val headers = HttpHeaders()
        headers.set("Accept-Language", "fr")
        val entity = HttpEntity<String>(headers)
        testRestTemplate.exchange<String>("/", HttpMethod.GET, entity)

        val postEntity = getTestEntity("Botswana2018.PJNZ")
        testRestTemplate.postForEntity<String>("/baseline/pjnz/", postEntity)

        val postShapeEntity = getTestEntity("malawi.geojson")
        testRestTemplate.postForEntity<String>("/baseline/shape/", postShapeEntity)

        val responseEntity = testRestTemplate.getForEntity<String>("/baseline/validate/")
        assertSecureWithError(IsAuthorized.TRUE,
                responseEntity,
                HttpStatus.BAD_REQUEST,
                "INVALID_BASELINE",
                "French message here")
    }
}