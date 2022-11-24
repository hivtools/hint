package org.imperial.mrc.hint.unit

import org.imperial.mrc.hint.ConfiguredAppProperties
import org.imperial.mrc.hint.helpers.readPropsFromTempFile
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import java.io.File

class AppPropertiesTests
{

    @AfterEach
    fun cleanup()
    {
        File("tmp").deleteRecursively()
    }

    @Test
    fun `properties can be read from disk`()
    {

        val props = readPropsFromTempFile("something=1234")
        assertEquals(props["something"], "1234")
    }

    @Test
    fun `properties are expected at the correct path`()
    {
        assertEquals(ConfiguredAppProperties.configPath, "/etc/hint/config.properties")
    }

    @Test
    fun `can read uploadDirectory`()
    {
        val props = readPropsFromTempFile("upload_dir=/fakedir")
        val sut = ConfiguredAppProperties(props)
        assertEquals(sut.uploadDirectory, "/fakedir")
    }

    @Test
    fun `can read tokenIssuer`()
    {
        val props = readPropsFromTempFile("token_issuer=fakeIssuer")
        val sut = ConfiguredAppProperties(props)
        assertEquals(sut.tokenIssuer, "fakeIssuer")
    }

    @Test
    fun `can read applicationTitle`()
    {
        val props = readPropsFromTempFile("application_title=TestTitle")
        val sut = ConfiguredAppProperties(props)
        assertEquals(sut.applicationTitle, "TestTitle")
    }

    @Test
    fun `can read exploreApplicationTitle`()
    {
        val props = readPropsFromTempFile("explore_application_title=Explore TestTitle")
        val sut = ConfiguredAppProperties(props)
        assertEquals(sut.exploreApplicationTitle, "Explore TestTitle")
    }

    @Test
    fun `can read applicationUrl`()
    {
        val props = readPropsFromTempFile("application_url=https://test")
        val sut = ConfiguredAppProperties(props)
        assertEquals(sut.applicationUrl, "https://test")
    }

    @Test
    fun `can read email mode`()
    {
        val props = readPropsFromTempFile("email_mode=test_mode")
        val sut = ConfiguredAppProperties(props)
        assertEquals(sut.emailMode, "test_mode")
    }

    @Test
    fun `can read email server`()
    {
        val props = readPropsFromTempFile("email_server=test_server")
        val sut = ConfiguredAppProperties(props)
        assertEquals(sut.emailServer, "test_server")
    }

    @Test
    fun `can read email port`()
    {
        val props = readPropsFromTempFile("email_port=100")
        val sut = ConfiguredAppProperties(props)
        assertEquals(sut.emailPort, 100)
    }

    @Test
    fun `can read email sender`()
    {
        val props = readPropsFromTempFile("email_sender=test_sender")
        val sut = ConfiguredAppProperties(props)
        assertEquals(sut.emailSender, "test_sender")
    }

    @Test
    fun `can read email username`()
    {
        val props = readPropsFromTempFile("email_username=test_username")
        val sut = ConfiguredAppProperties(props)
        assertEquals(sut.emailUsername, "test_username")
    }

    @Test
    fun `can read email password`()
    {
        val props = readPropsFromTempFile("email_password=test_password")
        val sut = ConfiguredAppProperties(props)
        assertEquals(sut.emailPassword, "test_password")
    }

    @Test
    fun `can read db user`()
    {
        val props = readPropsFromTempFile("db_user=test")
        val sut = ConfiguredAppProperties(props)
        assertEquals(sut.dbUser, "test")
    }

    @Test
    fun `can read db pw`()
    {
        val props = readPropsFromTempFile("db_password=test")
        val sut = ConfiguredAppProperties(props)
        assertEquals(sut.dbPassword, "test")
    }

    @Test
    fun `can read support email`()
    {
        val props = readPropsFromTempFile("support_email=test@email.com")
        val sut = ConfiguredAppProperties(props)
        assertEquals(sut.supportEmail, "test@email.com")
    }

    @Test
    fun `can read adr output zip schema`()
    {
        val props = readPropsFromTempFile("adr_output_zip_schema=test-zip-schema")
        val sut = ConfiguredAppProperties(props)
        assertEquals(sut.adrOutputZipSchema, "test-zip-schema")
    }

    @Test
    fun `can read adr output summary schema`()
    {
        val props = readPropsFromTempFile("adr_output_summary_schema=test-summary-schema")
        val sut = ConfiguredAppProperties(props)
        assertEquals(sut.adrOutputSummarySchema, "test-summary-schema")
    }

    @Test
    fun `can read issue report url`()
    {
        val props = readPropsFromTempFile("issue_report_url=https://webhook.azure")
        val sut = ConfiguredAppProperties(props)
        assertEquals(sut.issueReportUrl, "https://webhook.azure")
    }

    @Test
    fun `can read oauth2 client id`()
    {
        val props = readPropsFromTempFile(" oauth2_client_id=id")
        val sut = ConfiguredAppProperties(props)
        assertEquals(sut.oauth2ClientId, "id")
    }

    @Test
    fun `can read oauth2 client secret`()
    {
        val props = readPropsFromTempFile("oauth2_client_secret=secret")
        val sut = ConfiguredAppProperties(props)
        assertEquals(sut.oauth2ClientSecret, "secret")
    }

    @Test
    fun `can read oauth2 client url`()
    {
        val props = readPropsFromTempFile("oauth2_client_url=https://auth0.com")
        val sut = ConfiguredAppProperties(props)
        assertEquals(sut.oauth2ClientUrl, "https://auth0.com")
    }

    @Test
    fun `can read oauth2 audience`()
    {
        val props = readPropsFromTempFile("oauth2_client_audience=audience")
        val sut = ConfiguredAppProperties(props)
        assertEquals(sut.oauth2ClientAudience, "audience")
    }

    @Test
    fun `can read oauth2 client ADR url`()
    {
        val props = readPropsFromTempFile("oauth2_client_adr_url=http://flask.imperial")
        val sut = ConfiguredAppProperties(props)
        assertEquals(sut.oauth2ClientAdrUrl, "http://flask.imperial")
    }

    @Test
    fun `can read oauth2 login method`()
    {
        val props = readPropsFromTempFile("oauth2_login_method=false")
        val sut = ConfiguredAppProperties(props)
        assertEquals(sut.oauth2LoginMethod, false)
    }
}
