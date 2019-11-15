package org.imperial.mrc.hint.integration

import com.nhaarman.mockito_kotlin.isA
import org.assertj.core.api.AssertionsForClassTypes.assertThat
import org.imperial.mrc.hint.helpers.getTestEntity
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.EnumSource
import org.springframework.boot.test.web.client.exchange
import org.springframework.boot.test.web.client.getForEntity
import org.springframework.boot.test.web.client.postForEntity
import org.springframework.http.HttpMethod
import org.springframework.http.HttpStatus

class BaselineTests : SessionFileTests() {

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can get pjnz data`(isAuthorized: IsAuthorized) {
        val postEntity = getTestEntity("Botswana2018.PJNZ")
        testRestTemplate.postForEntity<String>("/baseline/pjnz/", postEntity)
        val responseEntity = testRestTemplate.getForEntity<String>("/baseline/pjnz/")
        assertSecureWithSuccess(isAuthorized, responseEntity, "ValidateInputResponse")
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can get shape data`(isAuthorized: IsAuthorized) {
        val postEntity = getTestEntity("malawi.geojson")
        testRestTemplate.postForEntity<String>("/baseline/shape/", postEntity)
        val responseEntity = testRestTemplate.getForEntity<String>("/baseline/shape/")
        assertSecureWithSuccess(isAuthorized, responseEntity, "ValidateInputResponse")
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can get population data`(isAuthorized: IsAuthorized) {
        val postEntity = getTestEntity("population.csv")
        testRestTemplate.postForEntity<String>("/baseline/population/", postEntity)
        val responseEntity = testRestTemplate.getForEntity<String>("/baseline/population/")
        assertSecureWithSuccess(isAuthorized, responseEntity, "ValidateInputResponse")
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can upload pjnz file`(isAuthorized: IsAuthorized) {
        val postEntity = getTestEntity("Botswana2018.PJNZ")
        val responseEntity = testRestTemplate.postForEntity<String>("/baseline/pjnz/", postEntity)
        assertSecureWithSuccess(isAuthorized, responseEntity, "ValidateInputResponse")

        if (isAuthorized == IsAuthorized.TRUE) {
            val data = getResponseData(responseEntity)
            assertThat(data["type"].asText()).isEqualTo("pjnz")
        }
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can upload zip file as pjnz`(isAuthorized: IsAuthorized) {
        val postEntity = getTestEntity("Botswana2018.zip")
        val responseEntity = testRestTemplate.postForEntity<String>("/baseline/pjnz/", postEntity)
        assertSecureWithSuccess(isAuthorized, responseEntity, "ValidateInputResponse")

        if (isAuthorized == IsAuthorized.TRUE) {
            val data = getResponseData(responseEntity)
            assertThat(data["type"].asText()).isEqualTo("pjnz")
            assertThat(data["filename"].asText()).isEqualTo("Botswana2018.zip")
        }
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can upload shape file`(isAuthorized: IsAuthorized) {
        val postEntity = getTestEntity("malawi.geojson")
        val entity = testRestTemplate.postForEntity<String>("/baseline/shape/", postEntity)
        assertSecureWithSuccess(isAuthorized, entity, "ValidateInputResponse")

        if (isAuthorized == IsAuthorized.TRUE) {
            val data = getResponseData(entity)
            assertThat(data["type"].asText()).isEqualTo("shape")
        }
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can upload population file`(isAuthorized: IsAuthorized) {
        val postEntity = getTestEntity("population.csv")
        val entity = testRestTemplate.postForEntity<String>("/baseline/population/", postEntity)
        assertSecureWithSuccess(isAuthorized, entity, "ValidateInputResponse")

        if (isAuthorized == IsAuthorized.TRUE) {
            val data = getResponseData(entity)
            assertThat(data["type"].asText()).isEqualTo("population")
        }
    }


    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can delete pjnz data`(isAuthorized: IsAuthorized) {
        val hash = setUpSessionFileAndGetHash(isAuthorized, "Botswana2018.PJNZ", "/baseline/pjnz/")
        assertSessionFileExists(isAuthorized, hash)
        val responseEntity = testRestTemplate.exchange<String>("/baseline/pjnz/$hash/", HttpMethod.DELETE)
        assertSecureWithSuccess(isAuthorized, responseEntity, null)
        assertSessionFileDoesNotExist(hash)
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can delete shape data`(isAuthorized: IsAuthorized) {
        val hash = setUpSessionFileAndGetHash(isAuthorized, "malawi.geojson", "/baseline/shape/")
        assertSessionFileExists(isAuthorized, hash)
        val responseEntity = testRestTemplate.exchange<String>("/baseline/shape/$hash/", HttpMethod.DELETE)
        assertSecureWithSuccess(isAuthorized, responseEntity, null)
        assertSessionFileDoesNotExist(hash)
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can delete population data`(isAuthorized: IsAuthorized) {
        val hash = setUpSessionFileAndGetHash(isAuthorized, "population.csv", "/baseline/population/")
        assertSessionFileExists(isAuthorized, hash)
        val responseEntity = testRestTemplate.exchange<String>("/baseline/population/$hash/", HttpMethod.DELETE)
        assertSecureWithSuccess(isAuthorized, responseEntity, null)
        assertSessionFileDoesNotExist(hash)
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can get consistent validate result when no files are uploaded`(isAuthorized: IsAuthorized) {
        val responseEntity = testRestTemplate.getForEntity<String>("/baseline/validate/")
        assertSecureWithSuccess(isAuthorized, responseEntity, "ValidateBaselineResponse")
        if (isAuthorized == IsAuthorized.TRUE) {
            val data = getResponseData(responseEntity)
            assertThat(data["consistent"].asBoolean()).isEqualTo(true)
        }
    }

    @Test
    fun `can get consistent validate result when all files are uploaded`() {
        authorize()
        testRestTemplate.getForEntity<String>("/")

        val postEntity = getTestEntity("Malawi2019.PJNZ")
        testRestTemplate.postForEntity<String>("/baseline/pjnz/", postEntity)

        val postShapeEntity = getTestEntity("malawi.geojson")
        testRestTemplate.postForEntity<String>("/baseline/shape/", postShapeEntity)

        val postPopEntity = getTestEntity("population.csv")
        testRestTemplate.postForEntity<String>("/baseline/population/", postPopEntity)

        val responseEntity = testRestTemplate.getForEntity<String>("/baseline/validate/")
        assertSecureWithSuccess(IsAuthorized.TRUE, responseEntity, "ValidateBaselineResponse")

        val data = getResponseData(responseEntity)
        assertThat(data["consistent"].asBoolean()).isEqualTo(true)
    }

    @Test
    fun `can get 400 result when inconsistent files are uploaded`() {
        authorize()
        testRestTemplate.getForEntity<String>("/")

        val postEntity = getTestEntity("Botswana2018.PJNZ")
        testRestTemplate.postForEntity<String>("/baseline/pjnz/", postEntity)

        val postShapeEntity = getTestEntity("malawi.geojson")
        testRestTemplate.postForEntity<String>("/baseline/shape/", postShapeEntity)

        val postPopEntity = getTestEntity("population.csv")
        testRestTemplate.postForEntity<String>("/baseline/population/", postPopEntity)

        val responseEntity = testRestTemplate.getForEntity<String>("/baseline/validate/")
        assertSecureWithError(IsAuthorized.TRUE, responseEntity, HttpStatus.BAD_REQUEST, "INVALID_BASELINE")
    }
}
