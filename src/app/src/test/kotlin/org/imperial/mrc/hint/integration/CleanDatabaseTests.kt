package org.imperial.mrc.hint.integration

import org.jooq.Table
import org.imperial.mrc.hint.db.DbProfileServiceUserRepository
import org.imperial.mrc.hint.db.JooqContext
import org.imperial.mrc.hint.db.Tables
import org.imperial.mrc.hint.helpers.tmpUploadDirectory
import org.imperial.mrc.hint.unit.db.UserRepositoryTests
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.extension.ExtendWith
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.junit.jupiter.SpringExtension
import java.io.File
import javax.sql.DataSource

@ActiveProfiles(profiles = ["dev"])
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ExtendWith(SpringExtension::class)
abstract class CleanDatabaseTests
{
    @Autowired
    private lateinit var dataSource: DataSource

    @Autowired
    private lateinit var userRepo: DbProfileServiceUserRepository

    @AfterEach
    fun tearDown() {
        File(tmpUploadDirectory).deleteRecursively()

        val tableFields = Tables::class.java.fields

        JooqContext(dataSource).use {

            for (tableField in tableFields){
                val table = tableField.get(null) as Table<*>
                it.dsl.deleteFrom(table)
                        .execute()
            }
        }

        userRepo.addUser("test.user@example.com", "password")
    }
}

