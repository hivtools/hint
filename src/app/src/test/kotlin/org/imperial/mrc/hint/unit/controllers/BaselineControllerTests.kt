package org.imperial.mrc.hint.unit.controllers

import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import org.imperial.mrc.hint.APIClient
import org.imperial.mrc.hint.FileManager
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.controllers.BaselineController
import org.imperial.mrc.hint.controllers.HintrController
import org.imperial.mrc.hint.models.SessionFileWithPath
import org.junit.jupiter.api.Test
import org.assertj.core.api.Assertions.assertThat
import org.springframework.http.ResponseEntity

class BaselineControllerTests : HintrControllerTests() {

    override fun getSut(mockFileManager: FileManager, mockAPIClient: APIClient): HintrController {
        return BaselineController(mockFileManager, mockAPIClient)
    }

    @Test
    fun `validates pjnz file`() {
        assertValidates(FileType.PJNZ) {
            sut ->  (sut as BaselineController).uploadPJNZ(mockFile)
        }
    }

    @Test
    fun `validates shape file`() {
        assertValidates(FileType.Shape) {
            sut ->  (sut as BaselineController).uploadShape(mockFile)
        }
    }

    @Test
    fun `validates population file`() {
        assertValidates(FileType.Population) {
            sut ->  (sut as BaselineController).uploadPopulation(mockFile)
        }
    }

    @Test
    fun `getShape gets the validation result if the file exists`() {
        assertGetsIfExists(FileType.Shape) {
            sut ->  (sut as BaselineController).getShape()
        }
    }

    @Test
    fun `getPopulation gets the validation result if the file exists`() {
        assertGetsIfExists(FileType.Population) {
            sut ->  (sut as BaselineController).getPopulation()
        }
    }

    @Test
    fun `getPJNZ gets the validation result if the file exists`() {
        assertGetsIfExists(FileType.PJNZ) {
            sut ->  (sut as BaselineController).getPJNZ()
        }
    }

    @Test
    fun `validates combined files`() {
        val mockPjnz = SessionFileWithPath("pjnzPath", "pjnzHash", "pjnzFile")
        val mockShape =SessionFileWithPath("shapePath", "shapeHash", "shapeFile")
        val mockPop = SessionFileWithPath("popPath", "pjnzHash", "popFile")

        val mockFileManager = mock<FileManager> {
            on { getFile(FileType.PJNZ) } doReturn mockPjnz
            on { getFile(FileType.Shape) } doReturn mockShape
            on { getFile(FileType.Population) } doReturn mockPop
        }

        val mockResponse = mock<ResponseEntity<String>>()
        val mockAPIClient = mock<APIClient>{
            on { validateBaselineCombined(mockPjnz, mockShape, mockPop) } doReturn mockResponse
        }

        val sut = BaselineController(mockFileManager, mockAPIClient)
        val result = sut.validate()

        assertThat(result).isSameAs(mockResponse)
    }
}
