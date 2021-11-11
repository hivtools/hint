package org.imperial.mrc.hint.unit.templates

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.ui.ConcurrentModel

class DataExplorationTests
{
    companion object
    {
        val template = FreemarkerTemplateLoader("data-exploration.ftl")

    }

    @Test
    fun `renders as expected`()
    {
        val model = ConcurrentModel()
        model["title"] = "ExploreAppTitle"
        model["user"] = "guest"
        val doc = template.jsoupDocFor(model)

        assertThat(doc.select("title").text()).isEqualTo("ExploreAppTitle")
        assertThat(doc.select(".container").text()).isEqualTo("Data Exploration content will go here")
    }
}
