package org.imperial.mrc.hint.unit.controllers

import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import org.assertj.core.api.AssertionsForClassTypes.assertThat
import org.imperial.mrc.hint.controllers.SaveAndLoadController
import org.imperial.mrc.hint.db.StateRepository
import org.imperial.mrc.hint.models.SessionFile
import org.imperial.mrc.hint.security.Session
import org.junit.jupiter.api.Test

class SaveAndLoadControllerTests {

    @Test
    fun `saves JSON dictionary of hashes`() {

        val session = mock<Session> {
            on { getId() } doReturn "sid"
        }
        val mockRepo = mock<StateRepository> {
            on { getFilesForSession("sid") } doReturn listOf(SessionFile("hash", "survey"))
        }

        val sut = SaveAndLoadController(session, mockRepo)
        val result = sut.save()
        assertThat(result.body).isEqualTo("{\"survey\":\"hash\"}")
        val attachmentHeader = result.headers["Content-Disposition"]!!.first()
        assertThat(Regex("attachment; filename=\"sid-(.*).json\"").matches(attachmentHeader)).isTrue()
    }
}
