package org.imperial.mrc.hint.unit

import org.assertj.core.api.Java6Assertions.assertThat
import org.imperial.mrc.hint.ConfiguredAppProperties
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import java.io.File

class AppPropertiesTests {

    @AfterEach
    fun cleanup() {
        File("tmp").deleteRecursively()
    }

    @Test
    fun `properties can be read from disk`() {

        File("tmp").mkdir()
        val config = File("tmp/fake.properties")
        config.createNewFile()
        config.writeText("something=1234")
        val props = ConfiguredAppProperties.readProperties("tmp/fake.properties")
        assertThat(props["something"]).isEqualTo("1234")
    }

    @Test
    fun `properties are expected at the correct path`() {
        assertThat(ConfiguredAppProperties.configPath).isEqualTo("/etc/hint/config.properties")
    }
}