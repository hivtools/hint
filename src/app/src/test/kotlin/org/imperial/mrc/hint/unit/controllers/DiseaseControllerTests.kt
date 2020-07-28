package org.imperial.mrc.hint.unit.controllers

import com.nhaarman.mockito_kotlin.mock
import org.imperial.mrc.hint.clients.HintrAPIClient
import org.imperial.mrc.hint.FileManager
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.controllers.DiseaseController
import org.imperial.mrc.hint.controllers.HintrController
import org.imperial.mrc.hint.db.SnapshotRepository
import org.imperial.mrc.hint.exceptions.HintException
import org.imperial.mrc.hint.helpers.TranslationAssert
import org.imperial.mrc.hint.security.Session
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus

class DiseaseControllerTests: HintrControllerTests() {

    override fun getSut(mockFileManager: FileManager, mockAPIClient: HintrAPIClient,
                        mockSession: Session, mockSnapshotRepository: SnapshotRepository): HintrController {
        return DiseaseController(mockFileManager, mockAPIClient, mockSession, mockSnapshotRepository)
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
    fun `deletes survey file`() {
        assertDeletes(FileType.Survey) { sut ->
            (sut as DiseaseController).removeSurvey()
        }
    }

    @Test
    fun `deletes programme file`() {
        assertDeletes(FileType.Programme) { sut ->
            (sut as DiseaseController).removeProgramme()
        }
    }

    @Test
    fun `deletes anc file`() {
        assertDeletes(FileType.ANC) { sut ->
            (sut as DiseaseController).removeANC()
        }
    }

    @Test
    fun `throws error if the shape file does not exist`() {

        val mockApiClient = getMockAPIClient(FileType.Survey)
        val sut = DiseaseController(mock(), mockApiClient, mock(), mock())

        TranslationAssert.assertThatThrownBy { sut.uploadSurvey(mockFile) }
                .isInstanceOf(HintException::class.java)
                .matches{ (it as HintException).httpStatus == HttpStatus.BAD_REQUEST }
                .hasTranslatedMessage("You must upload a shape file before uploading survey or programme data.")
    }
}
