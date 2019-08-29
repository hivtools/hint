package org.imperial.mrc.hint.db

import java.sql.Connection
import org.jooq.DSLContext
import org.jooq.SQLDialect
import org.jooq.impl.DSL
import org.springframework.beans.factory.DisposableBean
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.jdbc.datasource.TransactionAwareDataSourceProxy
import org.springframework.web.context.annotation.RequestScope
import javax.sql.DataSource

@Bean
fun getDSL(@Autowired context: JooqContext): DSLContext
{
    return context.dsl
}

@Configuration
@RequestScope
class JooqContext(private val dataSource: DataSource) : DisposableBean, AutoCloseable
{
    private val conn = getConnection()
    val dsl = createDSL(conn)

    private fun getConnection(): Connection
    {
        return TransactionAwareDataSourceProxy(dataSource).getConnection()
    }

    private fun createDSL(conn: Connection): DSLContext
    {
        return DSL.using(conn, SQLDialect.POSTGRES)
    }

    override fun close()
    {
        conn.close()
    }

    override fun destroy()
    {
        close()
    }
}

