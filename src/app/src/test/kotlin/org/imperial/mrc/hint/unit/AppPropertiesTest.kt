package org.imperial.mrc.hint.unit

import org.assertj.core.api.Java6Assertions.assertThat
import org.imperial.mrc.hint.ConfiguredAppProperties
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import java.io.File
import java.util.*

class AppPropertiesTests {

    @AfterEach
    fun cleanup() {
        File("tmp").deleteRecursively()
    }

    private fun readPropsFromTempFile(contents: String): Properties {
        File("tmp").mkdir()
        val config = File("tmp/fake.properties")
        config.createNewFile()
        config.writeText(contents)
        return ConfiguredAppProperties.readProperties("tmp/fake.properties")
    }

    @Test
    fun `properties can be read from disk`() {

        val props = readPropsFromTempFile("something=1234")
        assertThat(props["something"]).isEqualTo("1234")
    }

    @Test
    fun `properties are expected at the correct path`() {
        assertThat(ConfiguredAppProperties.configPath).isEqualTo("/etc/hint/config.properties")
    }

    @Test
    fun `can read uploadDirectory`(){
        val props = readPropsFromTempFile("upload_dir=/fakedir")
        val sut = ConfiguredAppProperties(props)
        assertThat(sut.uploadDirectory).isEqualTo("/fakedir")
    }

    @Test
    fun `can read tokenIssuer`(){
        val props = readPropsFromTempFile("token_issuer=fakeIssuer")
        val sut = ConfiguredAppProperties(props)
        assertThat(sut.tokenIssuer).isEqualTo("fakeIssuer")
    }

    @Test
    fun `can read applicationTitle`(){
        val props = readPropsFromTempFile("application_title=TestTitle")
        val sut = ConfiguredAppProperties(props)
        assertThat(sut.applicationTitle).isEqualTo("TestTitle")
    }

    @Test
    fun `can read applicationUrl`(){
        val props = readPropsFromTempFile("application_url=https://test")
        val sut = ConfiguredAppProperties(props)
        assertThat(sut.applicationUrl).isEqualTo("https://test")
    }

    @Test
    fun `can read email mode`(){
        val props = readPropsFromTempFile("email_mode=test_mode")
        val sut = ConfiguredAppProperties(props)
        assertThat(sut.emailMode).isEqualTo("test_mode")
    }
}