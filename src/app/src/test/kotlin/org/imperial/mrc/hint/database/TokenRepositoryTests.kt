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
class TokenRepositoryTests {
    @Autowired
    private lateinit var sut: TokenRepository

    @Autowired
    private lateinit var dataSource: DataSource

    private val TOKEN = "testRepoToken"

    @Test
    fun `can store token`()
    {
        sut.storeOneTimeToken(TOKEN)
        assertThat(checkIfTokenExists()).isTrue()
    }

    @Test
    fun `validateOneTimeToken returns true and deletes if token exists`()
    {
        sut.storeOneTimeToken(TOKEN)

        val result = sut.validateOneTimeToken(TOKEN)

        assertThat(result).isTrue()
        assertThat(checkIfTokenExists()).isFalse()
    }

    @Test
    fun `validateOneTimeToken returns false if token does not exist`()
    {
        val result = sut.validateOneTimeToken(TOKEN)

        assertThat(result).isFalse()
    }

    private fun checkIfTokenExists(): Boolean
    {
        JooqContext(dataSource).use{
            val result = it.dsl.select()
                    .from(ONETIME_TOKEN)
                    .where(ONETIME_TOKEN.TOKEN.eq(TOKEN))
                    .fetch()

            return result.count() == 1
        }
    }
}