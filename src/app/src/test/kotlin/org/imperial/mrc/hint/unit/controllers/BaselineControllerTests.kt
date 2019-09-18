package org.imperial.mrc.hint.unit.controllers

import org.imperial.mrc.hint.APIClient
import org.imperial.mrc.hint.FileManager
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.controllers.BaselineController
import org.imperial.mrc.hint.controllers.HintrController
import org.junit.jupiter.api.Test

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
}
