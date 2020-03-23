package org.imperial.mrc.hint.integration

import org.assertj.core.api.AssertionsForClassTypes
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.db.Tables
import org.imperial.mrc.hint.helpers.getTestEntity
import org.springframework.boot.test.web.client.postForEntity

class SessionFileTests : SecureIntegrationTests() {

    protected fun assertSessionFileExists(isAuthorized: IsAuthorized, fileType: FileType) {
        if (isAuthorized == IsAuthorized.TRUE) {
            assertSessionFileExists(fileType)
        }
    }

    protected fun assertSessionFileExists(fileType: FileType) {
        val records = dsl.selectFrom(Tables.SESSION_FILE)
                .where(Tables.SESSION_FILE.TYPE.eq(fileType.toString()))
        AssertionsForClassTypes.assertThat(records.count()).isEqualTo(1)
    }

    protected fun assertSessionFileDoesNotExist(fileType: FileType) {
        val records = dsl.selectFrom(Tables.SESSION_FILE)
                .where(Tables.SESSION_FILE.TYPE.eq(fileType.toString()))
        AssertionsForClassTypes.assertThat(records.count()).isEqualTo(0)
    }

    protected fun setUpSessionFileAndGetHash(isAuthorized: IsAuthorized, filename: String, url: String): String {
        return if (isAuthorized == IsAuthorized.TRUE) {
            setUpSessionFileAndGetHash(filename, url)
        } else {
            "hash"
        }
    }

    protected fun setUpSessionFileAndGetHash(filename: String, url: String): String {
        val postEntity = getTestEntity(filename)
        val entity = testRestTemplate.postForEntity<String>(url, postEntity)
        return getResponseData(entity)["hash"].textValue()
    }
}