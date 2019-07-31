package org.imperial.mrc.hint.unit.templates

import org.junit.jupiter.api.Test
import org.springframework.ui.ConcurrentModel
import org.assertj.core.api.Assertions.assertThat

class LoginTests
{
    companion object
    {
        val template = FreemarkerTemplateLoader("login.ftl")
    }

    @Test
    fun `renders login form correctly with error`()
    {
        val model = ConcurrentModel()
        model["username"] = "test user"
        model["error"] = "test error"
        model["title"] = "test title"
        val doc = template.jsoupDocFor(model)

        assertThat(doc.select("form label[for='user-id']").text()).isEqualTo("Username")
        assertThat(doc.select("form #user-id").attr("value")).isEqualTo("test user")
        assertThat(doc.select("form #user-id").attr("type")).isEqualTo("text")

        assertThat(doc.select("form label[for='pw-id']").text()).isEqualTo("Password")
        assertThat(doc.select("form #pw-id").attr("value")).isEqualTo("")
        assertThat(doc.select("form #pw-id").attr("type")).isEqualTo("password")

        assertThat(doc.select("form input[type='submit']").attr("value")).isEqualTo("Log In")
        assertThat(doc.select("#error").text()).isEqualTo("test error")
    }

    @Test
    fun `renders login form correctly without error`()
    {
        val model = ConcurrentModel()
        model["username"] = ""
        model["error"] = ""
        model["title"] = "test title"
        val doc = template.jsoupDocFor(model)

        assertThat(doc.select("form label[for='user-id']").text()).isEqualTo("Username")
        assertThat(doc.select("form #user-id").attr("value")).isEqualTo("")

        assertThat(doc.select("form label[for='pw-id']").text()).isEqualTo("Password")
        assertThat(doc.select("form #pw-id").attr("value")).isEqualTo("")

        assertThat(doc.select("form input[type='submit']").attr("value")).isEqualTo("Log In")
        assertThat(doc.select("#error").count()).isEqualTo(0)
    }

}