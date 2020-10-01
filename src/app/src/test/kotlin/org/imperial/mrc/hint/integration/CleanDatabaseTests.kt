package org.imperial.mrc.hint.integration

import org.imperial.mrc.hint.db.Tables
import org.imperial.mrc.hint.helpers.tmpUploadDirectory
import org.imperial.mrc.hint.logic.DbProfileServiceUserLogic
import org.jooq.DSLContext
import org.jooq.Table
import org.junit.jupiter.api.AfterEach
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.client.TestRestTemplate
import org.springframework.boot.web.client.RestTemplateBuilder
import org.springframework.core.env.Environment
import org.springframework.test.context.ActiveProfiles
import java.io.File


@ActiveProfiles(profiles = ["dev"])
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
abstract class CleanDatabaseTests {

    @Autowired
    protected lateinit var dsl: DSLContext

    @Autowired
    protected lateinit var userRepo: DbProfileServiceUserLogic

    @Autowired
    lateinit var env: Environment

    @Autowired
    lateinit var restTemplateBuilder: RestTemplateBuilder

    @AfterEach
    fun tearDown() {
        File(tmpUploadDirectory).deleteRecursively()

        val tableFields = Tables::class.java.fields

        for (tableField in tableFields) {
            val table = tableField.get(null) as Table<*>
            dsl.truncate(table)
                    .cascade()
                    .execute()

        }

        userRepo.addUser("test.user@example.com", "password")
        userRepo.addUser("guest", "guest")
    }
}

