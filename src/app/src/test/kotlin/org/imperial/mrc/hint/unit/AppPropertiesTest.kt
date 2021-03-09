package org.imperial.mrc.hint.unit

import org.assertj.core.api.Java6Assertions.assertThat
import org.imperial.mrc.hint.ConfiguredAppProperties
import org.imperial.mrc.hint.HintProperties
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import java.io.File

class AppPropertiesTests
{

    @AfterEach
    fun cleanup()
    {
        File("tmp").deleteRecursively()
    }

    private fun readPropsFromTempFile(contents: String): HintProperties
    {
        File("tmp").mkdir()
        val config = File("tmp/fake.properties")
        config.createNewFile()
        config.writeText(contents)
        return ConfiguredAppProperties.readProperties("tmp/fake.properties")
    }

    @Test
    fun `properties can be read from disk`()
    {

        val props = readPropsFromTempFile("something=1234")
        assertThat(props["something"]).isEqualTo("1234")
    }

    @Test
    fun `properties are expected at the correct path`()
    {
        assertThat(ConfiguredAppProperties.configPath).isEqualTo("/etc/hint/config.properties")
    }

    @Test
    fun `can read uploadDirectory`()
    {
        val props = readPropsFromTempFile("upload_dir=/fakedir")
        val sut = ConfiguredAppProperties(props)
        assertThat(sut.uploadDirectory).isEqualTo("/fakedir")
    }

    @Test
    fun `can read tokenIssuer`()
    {
        val props = readPropsFromTempFile("token_issuer=fakeIssuer")
        val sut = ConfiguredAppProperties(props)
        assertThat(sut.tokenIssuer).isEqualTo("fakeIssuer")
    }

    @Test
    fun `can read applicationTitle`()
    {
        val props = readPropsFromTempFile("application_title=TestTitle")
        val sut = ConfiguredAppProperties(props)
        assertThat(sut.applicationTitle).isEqualTo("TestTitle")
    }

    @Test
    fun `can read applicationUrl`()
    {
        val props = readPropsFromTempFile("application_url=https://test")
        val sut = ConfiguredAppProperties(props)
        assertThat(sut.applicationUrl).isEqualTo("https://test")
    }

    @Test
    fun `can read email mode`()
    {
        val props = readPropsFromTempFile("email_mode=test_mode")
        val sut = ConfiguredAppProperties(props)
        assertThat(sut.emailMode).isEqualTo("test_mode")
    }

    @Test
    fun `can read email server`()
    {
        val props = readPropsFromTempFile("email_server=test_server")
        val sut = ConfiguredAppProperties(props)
        assertThat(sut.emailServer).isEqualTo("test_server")
    }

    @Test
    fun `can read email port`()
    {
        val props = readPropsFromTempFile("email_port=100")
        val sut = ConfiguredAppProperties(props)
        assertThat(sut.emailPort).isEqualTo(100)
    }

    @Test
    fun `can read email sender`()
    {
        val props = readPropsFromTempFile("email_sender=test_sender")
        val sut = ConfiguredAppProperties(props)
        assertThat(sut.emailSender).isEqualTo("test_sender")
    }

    @Test
    fun `can read email username`()
    {
        val props = readPropsFromTempFile("email_username=test_username")
        val sut = ConfiguredAppProperties(props)
        assertThat(sut.emailUsername).isEqualTo("test_username")
    }

    @Test
    fun `can read email password`()
    {
        val props = readPropsFromTempFile("email_password=test_password")
        val sut = ConfiguredAppProperties(props)
        assertThat(sut.emailPassword).isEqualTo("test_password")
    }

    @Test
    fun `can read db user`()
    {
        val props = readPropsFromTempFile("db_user=test")
        val sut = ConfiguredAppProperties(props)
        assertThat(sut.dbUser).isEqualTo("test")
    }

    @Test
    fun `can read db pw`()
    {
        val props = readPropsFromTempFile("db_password=test")
        val sut = ConfiguredAppProperties(props)
        assertThat(sut.dbPassword).isEqualTo("test")
    }

    @Test
    fun `can read support email`()
    {
        val props = readPropsFromTempFile("support_email=test@email.com")
        val sut = ConfiguredAppProperties(props)
        assertThat(sut.supportEmail).isEqualTo("test@email.com")
    }

    @Test
    fun `can read adr output zip schema`()
    {
        val props = readPropsFromTempFile("adr_output_zip_schema=test-zip-schema")
        val sut = ConfiguredAppProperties(props)
        assertThat(sut.adrOutputZipSchema).isEqualTo("test-zip-schema")
    }

    @Test
    fun `can read adr output summary schema`()
    {
        val props = readPropsFromTempFile("adr_output_summary_schema=test-summary-schema")
        val sut = ConfiguredAppProperties(props)
        assertThat(sut.adrOutputSummarySchema).isEqualTo("test-summary-schema")
    }
}
