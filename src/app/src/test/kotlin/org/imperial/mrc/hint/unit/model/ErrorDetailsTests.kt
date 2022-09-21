package org.imperial.mrc.hint.unit.model

import org.imperial.mrc.hint.models.ErrorDetail
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus

class ErrorDetailsTests
{
    @Test
    fun `test equals and hashcode`()
    {
        val compareErrorDetailsOne = ErrorDetail(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "test",
            "OTHER_ERROR",
            emptyList()
        )

        val compareErrorDetailsTwo = ErrorDetail(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "test",
            "OTHER_ERROR",
            emptyList()
        )

        assertNotSame(compareErrorDetailsOne, compareErrorDetailsTwo)
        assertTrue(compareErrorDetailsOne == compareErrorDetailsTwo)
        assertEquals(compareErrorDetailsOne.hashCode(), compareErrorDetailsTwo.hashCode())
    }
}