package org.imperial.mrc.hint.unit.security
import org.junit.jupiter.api.Test
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.security.Encryption

class EncryptionTests {

    @Test
    fun `can encrypt and decrypt`() {
        val plainText = "sometestkey123"
        val sut = Encryption()
        val encrypted = sut.encrypt(plainText)
        assertThat(encrypted).isNotEqualTo(plainText)

        val decrypted = sut.decrypt(encrypted)
        assertThat(decrypted).isEqualTo(plainText)
    }
}
