package org.imperial.mrc.hint.unit.security

import com.nhaarman.mockito_kotlin.mock
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.security.Pac4jProfileService
import org.imperial.mrc.hint.security.SecurePasswordEncoder
import org.junit.jupiter.api.Test
import org.springframework.jdbc.datasource.TransactionAwareDataSourceProxy
import javax.sql.DataSource

class Pac4jProfileServiceTests
{
    @Test
    fun `can get profile service`()
    {
        val mockDataSource = mock<DataSource>()
        val result = Pac4jProfileService(mockDataSource).profileService()

        assertThat(result.dataSource).isInstanceOf(TransactionAwareDataSourceProxy::class.java)
        assertThat((result.dataSource as TransactionAwareDataSourceProxy).targetDataSource).isSameAs(mockDataSource)
        assertThat(result.passwordEncoder).isInstanceOf(SecurePasswordEncoder::class.java)
    }
}