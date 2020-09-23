package org.imperial.mrc.hint.unit.controllers

import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.clients.HintrAPIClient
import org.imperial.mrc.hint.FileManager
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.controllers.BaselineController
import org.imperial.mrc.hint.controllers.HintrController
import org.imperial.mrc.hint.db.VersionRepository
import org.imperial.mrc.hint.models.VersionFileWithPath
import org.imperial.mrc.hint.security.Session
import org.junit.jupiter.api.Test
import org.springframework.http.ResponseEntity

class BaselineControllerTests : HintrControllerTests() {

    override fun getSut(mockFileManager: FileManager, mockAPIClient: HintrAPIClient,
                        mockSession: Session, mockVersionRepository: VersionRepository): HintrController {
        return BaselineController(mockFileManager, mockAPIClient, mockSession, mockVersionRepository)
    }

    @Test
    fun `validates pjnz file`() {
        assertSavesAndValidates(FileType.PJNZ) { sut ->
            (sut as BaselineController).uploadPJNZ(mockFile)
        }
    }

    @Test
    fun `validates shape file`() {
        assertSavesAndValidates(FileType.Shape) { sut ->
            (sut as BaselineController).uploadShape(mockFile)
        }
    }

    @Test
    fun `validates population file`() {
        assertSavesAndValidates(FileType.Population) { sut ->
            (sut as BaselineController).uploadPopulation(mockFile)
        }
    }

    @Test
    fun `getShape gets the validation result if the file exists`() {
        assertGetsIfExists(FileType.Shape) { sut ->
            (sut as BaselineController).getShape()
        }
    }

    @Test
    fun `getPopulation gets the validation result if the file exists`() {
        assertGetsIfExists(FileType.Population) { sut ->
            (sut as BaselineController).getPopulation()
        }
    }

    @Test
    fun `getPJNZ gets the validation result if the file exists`() {
        assertGetsIfExists(FileType.PJNZ) { sut ->
            (sut as BaselineController).getPJNZ()
        }
    }

    @Test
    fun `deletes pjnz file`() {
        assertDeletes(FileType.PJNZ) { sut ->
            (sut as BaselineController).removePJNZ()
        }
    }

    @Test
    fun `deletes shape file`() {
        assertDeletes(FileType.Shape) { sut ->
            (sut as BaselineController).removeShape()
        }
    }

    @Test
    fun `deletes population file`() {
        assertDeletes(FileType.Population) { sut ->
            (sut as BaselineController).removePopulation()
        }
    }

    @Test
    fun `validates combined files`() {
        val mockPjnz = VersionFileWithPath("pjnzPath", "pjnzHash", "pjnzFile", false)
        val mockShape = VersionFileWithPath("shapePath", "shapeHash", "shapeFile", false)
        val mockPop = VersionFileWithPath("popPath", "pjnzHash", "popFile", false)

        val mockFileManager = mock<FileManager> {
            on { getFile(FileType.PJNZ) } doReturn mockPjnz
            on { getFile(FileType.Shape) } doReturn mockShape
            on { getFile(FileType.Population) } doReturn mockPop
        }

        val mockResponse = mock<ResponseEntity<String>>()
        val files = mapOf(
                "pjnz" to mockPjnz,
                "shape" to mockShape,
                "population" to mockPop
        )
        val mockAPIClient = mock<HintrAPIClient> {
            on { validateBaselineCombined(files) } doReturn mockResponse
        }

        val sut = BaselineController(mockFileManager, mockAPIClient, mock(), mock())
        val result = sut.validate()

        assertThat(result).isSameAs(mockResponse)
    }
}
