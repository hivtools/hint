package org.imperial.mrc.hint.integration

import org.jooq.Table
import org.imperial.mrc.hint.db.DbProfileServiceUserRepository
import org.imperial.mrc.hint.db.Tables
import org.imperial.mrc.hint.db.Tables.SESSION_FILE
import org.imperial.mrc.hint.helpers.tmpUploadDirectory
import org.jooq.DSLContext
import org.junit.jupiter.api.AfterEach
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import java.io.File

@ActiveProfiles(profiles = ["dev"])
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
abstract class CleanDatabaseTests
{
    @Autowired
    private lateinit var dsl: DSLContext

    @Autowired
    private lateinit var userRepo: DbProfileServiceUserRepository

    @AfterEach
    fun tearDown() {
        File(tmpUploadDirectory).deleteRecursively()

        val tableFields = Tables::class.java.fields

//        // this table has foreign keys
//        // so has to be deleted first
//        dsl.deleteFrom(SESSION_FILE)
//                .execute()

        for (tableField in tableFields){
            val table = tableField.get(null) as Table<*>
            dsl.truncate(table)
                    .cascade()
                    .execute()

        }

        userRepo.addUser("test.user@example.com", "password")
    }
}

