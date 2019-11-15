package org.imperial.mrc.hint.integration

import org.assertj.core.api.AssertionsForClassTypes
import org.imperial.mrc.hint.db.Tables
import org.imperial.mrc.hint.helpers.getTestEntity
import org.springframework.boot.test.web.client.postForEntity

class SessionFileTests : SecureIntegrationTests() {

    protected fun assertSessionFileExists(isAuthorized: IsAuthorized, hash: String) {
        if (isAuthorized == IsAuthorized.TRUE) {
            val records = dsl.selectFrom(Tables.SESSION_FILE)
                    .where(Tables.SESSION_FILE.HASH.eq(hash))
            AssertionsForClassTypes.assertThat(records.count()).isEqualTo(1)
        }
    }

    protected fun assertSessionFileDoesNotExist(hash: String) {
        val records = dsl.selectFrom(Tables.SESSION_FILE)
                .where(Tables.SESSION_FILE.HASH.eq(hash))
        AssertionsForClassTypes.assertThat(records.count()).isEqualTo(0)
    }

    protected fun setUpSessionFileAndGetHash(isAuthorized: IsAuthorized, filename: String, url: String): String {
        return if (isAuthorized == IsAuthorized.TRUE) {
            val postEntity = getTestEntity(filename)
            val entity = testRestTemplate.postForEntity<String>(url, postEntity)
            getResponseData(entity)["hash"].textValue()
        } else {
            "hash"
        }
    }
}