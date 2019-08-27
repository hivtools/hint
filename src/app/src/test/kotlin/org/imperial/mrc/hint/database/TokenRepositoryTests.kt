package org.imperial.mrc.hint.database

import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.db.JooqContext
import org.imperial.mrc.hint.db.Tables.ONETIME_TOKEN
import org.imperial.mrc.hint.db.TokenRepository
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.junit.jupiter.SpringExtension
import org.springframework.transaction.annotation.Transactional
import javax.sql.DataSource

@ActiveProfiles(profiles=["test"])
@SpringBootTest
@ExtendWith(SpringExtension::class)
@Transactional
open class TokenRepositoryTests {
    @Autowired
    private lateinit var sut: TokenRepository

    @Autowired
    private lateinit var dataSource: DataSource

    @Test
    fun `can store token`()
    {
        sut.storeToken("testToken")

        JooqContext(dataSource).use{
            var result = it.dsl.select()
            .from(ONETIME_TOKEN)
            .where(ONETIME_TOKEN.TOKEN.eq("testToken"))
            .fetch()

            assertThat(result.count()).isEqualTo(1)
        }
    }
}