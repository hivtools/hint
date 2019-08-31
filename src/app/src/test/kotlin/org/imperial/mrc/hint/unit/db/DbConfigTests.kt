package org.imperial.mrc.hint.unit.db

import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import com.zaxxer.hikari.HikariDataSource
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.db.DbConfig
import org.junit.jupiter.api.Test

class DbConfigTests {

    @Test
    fun `gets DataSource with configured username and password`() {
        val appProps = mock<AppProperties> {
            on { dbUser } doReturn "db_username"
            on { dbPassword } doReturn "db_pw"
        }
        val sut = DbConfig()
        val result = sut.dataSource(appProps) as HikariDataSource
        assertThat(result.username).isEqualTo("db_username")
        assertThat(result.password).isEqualTo("db_pw")
    }
}