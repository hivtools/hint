package org.imperial.mrc.hint.integration

import org.imperial.mrc.hint.helpers.tmpUploadDirectory
import org.junit.jupiter.api.AfterEach
import java.io.File

abstract class IntegrationTests {

    @AfterEach
    fun tearDown() {
        File(tmpUploadDirectory).deleteRecursively()
    }
}