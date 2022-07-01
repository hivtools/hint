package org.imperial.mrc.hint.unit.templates

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.ui.ConcurrentModel

class LoginTests
{
    companion object
    {
        val template = FreemarkerTemplateLoader("login.ftl")
    }

    @Test
    fun `renders login form correctly`()
    {
        val model = ConcurrentModel()
        model["username"] = "test user"
        model["error"] = "test error"
        model["title"] = "test title"
        model["appTitle"] = "Naomi"
        model["continueTo"] = "/"
        val doc = template.jsoupDocFor(model)

        assertThat(doc.select("login").attr("username")).isEqualTo("test user")
        assertThat(doc.select("login").attr("error")).isEqualTo("test error")
        assertThat(doc.select("login").attr("title")).isEqualTo("test title")
        assertThat(doc.select("login").attr("app-title")).isEqualTo("Naomi")
        assertThat(doc.select("login").attr("continue-to")).isEqualTo("/")
    }

}
