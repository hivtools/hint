package org.imperial.mrc.hint.integration

import org.assertj.core.api.AssertionsForClassTypes
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.db.Tables
import org.imperial.mrc.hint.helpers.getTestEntity
import org.springframework.boot.test.web.client.postForEntity

class SnapshotFileTests : SecureIntegrationTests() {

    protected fun assertSnapshotFileExists(isAuthorized: IsAuthorized, fileType: FileType) {
        if (isAuthorized == IsAuthorized.TRUE) {
            assertSnapshotFileExists(fileType)
        }
    }

    protected fun assertSnapshotFileExists(fileType: FileType) {
        val records = dsl.selectFrom(Tables.VERSION_FILE)
                .where(Tables.VERSION_FILE.TYPE.eq(fileType.toString()))
        AssertionsForClassTypes.assertThat(records.count()).isEqualTo(1)
    }

    protected fun assertSnapshotFileDoesNotExist(fileType: FileType) {
        val records = dsl.selectFrom(Tables.VERSION_FILE)
                .where(Tables.VERSION_FILE.TYPE.eq(fileType.toString()))
        AssertionsForClassTypes.assertThat(records.count()).isEqualTo(0)
    }

    protected fun setUpSnapshotFileAndGetHash(isAuthorized: IsAuthorized, filename: String, url: String): String {
        return if (isAuthorized == IsAuthorized.TRUE) {
            setUpSnapshotFileAndGetHash(filename, url)
        } else {
            "hash"
        }
    }

    protected fun setUpSnapshotFileAndGetHash(filename: String, url: String): String {
        val postEntity = getTestEntity(filename)
        val entity = testRestTemplate.postForEntity<String>(url, postEntity)
        return getResponseData(entity)["hash"].textValue()
    }
}
