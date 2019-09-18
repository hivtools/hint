package org.imperial.mrc.hint.integration

import org.assertj.core.api.AssertionsForClassTypes.assertThat
import org.imperial.mrc.hint.helpers.getTestEntity
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.EnumSource
import org.springframework.boot.test.web.client.TestRestTemplate
import org.springframework.boot.test.web.client.postForEntity

class DiseaseTests : SecureIntegrationTests() {

    @BeforeEach
    fun `upload shape file`() {
        testRestTemplate.postForEntity<String>("/baseline/shape/",
                getTestEntity("malawi.geojson"))
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can upload survey file`(isAuthorized: IsAuthorized) {
        val postEntity = getTestEntity("survey.csv")
        val entity = testRestTemplate.postForEntity<String>("/disease/survey/", postEntity)
        assertSecureWithSuccess(isAuthorized, entity, "ValidateInputResponse")
        if (isAuthorized == IsAuthorized.TRUE) {
            val data = getResponseData(entity)
            assertThat(data["type"].asText()).isEqualTo("survey")
        }
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can upload program file`(isAuthorized: IsAuthorized) {
        val postEntity = getTestEntity("programme.csv")
        val entity = testRestTemplate.postForEntity<String>("/disease/program/", postEntity)
        assertSecureWithSuccess(isAuthorized, entity, "ValidateInputResponse")

        if (isAuthorized == IsAuthorized.TRUE) {
            val data = getResponseData(entity)
            assertThat(data["type"].asText()).isEqualTo("programme")
        }
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can upload ANC file`(isAuthorized: IsAuthorized) {
        val postEntity = getTestEntity("anc.csv")
        val entity = testRestTemplate.postForEntity<String>("/disease/anc/", postEntity)
        assertSecureWithSuccess(isAuthorized, entity, "ValidateInputResponse")

        if (isAuthorized == IsAuthorized.TRUE) {
            val data = getResponseData(entity)
            assertThat(data["type"].asText()).isEqualTo("anc")
        }
    }
}
