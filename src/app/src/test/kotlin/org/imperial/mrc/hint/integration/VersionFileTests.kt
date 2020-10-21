package org.imperial.mrc.hint.integration

import org.assertj.core.api.AssertionsForClassTypes
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.db.Tables
import org.imperial.mrc.hint.helpers.getTestEntity
import org.springframework.boot.test.web.client.postForEntity

class VersionFileTests : SecureIntegrationTests()
{

    protected fun assertVersionFileExists(isAuthorized: IsAuthorized, fileType: FileType)
    {
        if (isAuthorized == IsAuthorized.TRUE)
        {
            assertVersionFileExists(fileType)
        }
    }

    protected fun assertVersionFileExists(fileType: FileType)
    {
        val records = dsl.selectFrom(Tables.VERSION_FILE)
                .where(Tables.VERSION_FILE.TYPE.eq(fileType.toString()))
        AssertionsForClassTypes.assertThat(records.count()).isEqualTo(1)
    }

    protected fun assertVersionFileDoesNotExist(fileType: FileType)
    {
        val records = dsl.selectFrom(Tables.VERSION_FILE)
                .where(Tables.VERSION_FILE.TYPE.eq(fileType.toString()))
        AssertionsForClassTypes.assertThat(records.count()).isEqualTo(0)
    }

    protected fun setUpVersionFileAndGetHash(isAuthorized: IsAuthorized, filename: String, url: String): String
    {
        return if (isAuthorized == IsAuthorized.TRUE)
        {
            setUpVersionFileAndGetHash(filename, url)
        }
        else
        {
            "hash"
        }
    }

    protected fun setUpVersionFileAndGetHash(filename: String, url: String): String
    {
        val postEntity = getTestEntity(filename)
        val entity = testRestTemplate.postForEntity<String>(url, postEntity)
        return getResponseData(entity)["hash"].textValue()
    }
}
