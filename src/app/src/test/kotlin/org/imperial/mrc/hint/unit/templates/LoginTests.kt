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

        assertThat(doc.select("#app").attr("title")).isEqualTo("test title")
    }

}
