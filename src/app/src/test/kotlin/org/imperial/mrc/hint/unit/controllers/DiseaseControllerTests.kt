package org.imperial.mrc.hint.unit.controllers

import com.nhaarman.mockito_kotlin.mock
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.APIClient
import org.imperial.mrc.hint.FileManager
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.controllers.DiseaseController
import org.imperial.mrc.hint.controllers.HintrController
import org.imperial.mrc.hint.db.SessionRepository
import org.imperial.mrc.hint.exceptions.HintException
import org.imperial.mrc.hint.security.Session
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.http.HttpStatus

class DiseaseControllerTests: HintrControllerTests() {

    override fun getSut(mockFileManager: FileManager,
                        mockSession: Session,
                        mockSessionRepository: SessionRepository,
                        mockAPIClient: APIClient): HintrController {
        return DiseaseController(mockFileManager, mockSession, mockSessionRepository, mockAPIClient)
    }

    @Test
    fun `validates survey file`() {
        assertValidates(FileType.Survey) {
            sut ->  (sut as DiseaseController).uploadSurvey(mockFile)
        }
    }

    @Test
    fun `validates program file`() {
        assertValidates(FileType.Programme) {
            sut ->  (sut as DiseaseController).uploadProgramme(mockFile)
        }
    }

    @Test
    fun `validates anc file`() {
        assertValidates(FileType.ANC) {
            sut ->  (sut as DiseaseController).uploadANC(mockFile)
        }
    }

    @Test
    fun `throws error if the shape file does not exist`() {

        val mockApiClient = getMockAPIClient(FileType.Survey)
        val sut = DiseaseController(mock(), mock(), mock(), mockApiClient)

        val exception = assertThrows<HintException> { sut.uploadSurvey(mockFile) }
        assertThat(exception.httpStatus).isEqualTo(HttpStatus.BAD_REQUEST)
        assertThat(exception.message).isEqualTo("You must upload a shape file before uploading survey or programme data")
    }
}
