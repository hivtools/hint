package org.imperial.mrc.hint.unit.controllers

import org.imperial.mrc.hint.APIClient
import org.imperial.mrc.hint.FileManager
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.controllers.DiseaseController
import org.imperial.mrc.hint.controllers.HintrController
import org.junit.jupiter.api.Test

class DiseaseControllerTests: HintrControllerTests() {

    override fun getSut(mockFileManager: FileManager, mockAPIClient: APIClient): HintrController {
        return DiseaseController(mockFileManager, mockAPIClient)
    }

    @Test
    fun `validates survey file`() {
        assertValidates(FileType.Survey) {
            sut ->  (sut as DiseaseController).uploadSurvey(mockFile)
        }
    }

    @Test
    fun `validates program file`() {
        assertValidates(FileType.Program) {
            sut ->  (sut as DiseaseController).uploadProgram(mockFile)
        }
    }

    @Test
    fun `validates anc file`() {
        assertValidates(FileType.ANC) {
            sut ->  (sut as DiseaseController).uploadANC(mockFile)
        }
    }
}
