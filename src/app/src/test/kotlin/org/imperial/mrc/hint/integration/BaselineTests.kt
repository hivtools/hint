package org.imperial.mrc.hint.integration

import org.assertj.core.api.AssertionsForClassTypes.assertThat
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.helpers.getTestEntity
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.boot.test.web.client.exchange
import org.springframework.boot.test.web.client.getForEntity
import org.springframework.boot.test.web.client.postForEntity
import org.springframework.http.HttpMethod
import org.springframework.http.HttpStatus

class BaselineTests : VersionFileTests() {

    @BeforeEach
    fun setup() {
        authorize()
        testRestTemplate.getForEntity<String>("/")
    }

    @Test
    fun `can get pjnz data`() {
        val postEntity = getTestEntity("Botswana2018.PJNZ")
        testRestTemplate.postForEntity<String>("/baseline/pjnz/", postEntity)
        val responseEntity = testRestTemplate.getForEntity<String>("/baseline/pjnz/")
        assertSuccess(responseEntity, "ValidateInputResponse")
    }


    @Test
    fun `can get shape data`() {
        val postEntity = getTestEntity("malawi.geojson")
        testRestTemplate.postForEntity<String>("/baseline/shape/", postEntity)
        val responseEntity = testRestTemplate.getForEntity<String>("/baseline/shape/")
        assertSuccess(responseEntity, "ValidateInputResponse")
    }


    @Test
    fun `can get population data`() {
        val postEntity = getTestEntity("population.csv")
        testRestTemplate.postForEntity<String>("/baseline/population/", postEntity)
        val responseEntity = testRestTemplate.getForEntity<String>("/baseline/population/")
        assertSuccess(responseEntity, "ValidateInputResponse")
    }


    @Test
    fun `can upload pjnz file`() {
        val postEntity = getTestEntity("Botswana2018.PJNZ")
        val responseEntity = testRestTemplate.postForEntity<String>("/baseline/pjnz/", postEntity)
        assertSuccess(responseEntity, "ValidateInputResponse")

        val data = getResponseData(responseEntity)
        assertThat(data["type"].asText()).isEqualTo("pjnz")
    }


    @Test
    fun `can upload zip file as pjnz`() {
        val postEntity = getTestEntity("Botswana2018.zip")
        val responseEntity = testRestTemplate.postForEntity<String>("/baseline/pjnz/", postEntity)
        assertSuccess(responseEntity, "ValidateInputResponse")

        val data = getResponseData(responseEntity)
        assertThat(data["type"].asText()).isEqualTo("pjnz")
        assertThat(data["filename"].asText()).isEqualTo("Botswana2018.zip")
    }


    @Test
    fun `can upload shape file`() {
        val postEntity = getTestEntity("malawi.geojson")
        val entity = testRestTemplate.postForEntity<String>("/baseline/shape/", postEntity)
        assertSuccess(entity, "ValidateInputResponse")

        val data = getResponseData(entity)
        assertThat(data["type"].asText()).isEqualTo("shape")
    }


    @Test
    fun `can upload population file`() {
        val postEntity = getTestEntity("population.csv")
        val entity = testRestTemplate.postForEntity<String>("/baseline/population/", postEntity)
        assertSuccess(entity, "ValidateInputResponse")

        val data = getResponseData(entity)
        assertThat(data["type"].asText()).isEqualTo("population")
    }


    @Test
    fun `can delete pjnz data`() {
        setUpVersionFileAndGetHash("Botswana2018.PJNZ", "/baseline/pjnz/")
        assertVersionFileExists(FileType.PJNZ)
        val responseEntity = testRestTemplate.exchange<String>("/baseline/pjnz/", HttpMethod.DELETE)
        assertSuccess(responseEntity, null)
        assertVersionFileDoesNotExist(FileType.PJNZ)
    }


    @Test
    fun `can delete shape data`() {
        setUpVersionFileAndGetHash("malawi.geojson", "/baseline/shape/")
        assertVersionFileExists(FileType.Shape)
        val responseEntity = testRestTemplate.exchange<String>("/baseline/shape/", HttpMethod.DELETE)
        assertSuccess(responseEntity, null)
        assertVersionFileDoesNotExist(FileType.Shape)
    }


    @Test
    fun `can delete population data`() {
        setUpVersionFileAndGetHash("population.csv", "/baseline/population/")
        assertVersionFileExists(FileType.Population)
        val responseEntity = testRestTemplate.exchange<String>("/baseline/population/", HttpMethod.DELETE)
        assertSuccess(responseEntity, null)
        assertVersionFileDoesNotExist(FileType.Population)
    }


    @Test
    fun `can get consistent validate result when no files are uploaded`() {
        val responseEntity = testRestTemplate.getForEntity<String>("/baseline/validate/")
        assertSuccess(responseEntity, "ValidateBaselineResponse")
        val data = getResponseData(responseEntity)
        assertThat(data["consistent"].asBoolean()).isEqualTo(true)
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
        assertSuccess(responseEntity, "ValidateBaselineResponse")

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
        assertError(responseEntity, HttpStatus.BAD_REQUEST, "INVALID_BASELINE")
    }
}
