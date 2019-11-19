package org.imperial.mrc.hint.unit.security.tokens

import com.nhaarman.mockito_kotlin.*
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.security.tokens.FileManager
import org.imperial.mrc.hint.security.tokens.KeyFileManager
import org.imperial.mrc.hint.security.tokens.KeyHelper
import org.junit.jupiter.api.Test
import org.mockito.internal.verification.Times
import java.security.KeyFactory
import java.security.interfaces.RSAPrivateKey
import java.security.interfaces.RSAPublicKey
import java.security.spec.PKCS8EncodedKeySpec
import java.security.spec.X509EncodedKeySpec

class KeyHelperTests {

    private val keyFactory = KeyFactory.getInstance("RSA")

    private fun keyIsEqual(bytes: ByteArray, key: RSAPublicKey): Boolean {
        val spec = X509EncodedKeySpec(bytes)
        return keyFactory.generatePublic(spec) == key
    }

    private fun keyIsEqual(bytes: ByteArray, key: RSAPrivateKey): Boolean {
        val spec = PKCS8EncodedKeySpec(bytes)
        return keyFactory.generatePrivate(spec) == key
    }

    @Test
    fun `can get KeyPair`() {
        val result = KeyHelper.keyPair
        assertThat(result.private).isInstanceOf(RSAPrivateKey::class.java)
        assertThat(result.public).isInstanceOf(RSAPublicKey::class.java)
    }

    @Test
    fun `saves KeyPair to disk if directory exists`() {
        val mockFileManager = mock<FileManager> {
            on { exists(any()) } doReturn true
        }

        val result = KeyHelper.generateKeyPair(mockFileManager)

        assertThat(result.private).isInstanceOf(RSAPrivateKey::class.java)
        assertThat(result.public).isInstanceOf(RSAPublicKey::class.java)

        verify(mockFileManager).writeToFile(argWhere { it.name == "public_key.der" },
                argWhere { keyIsEqual(it, result.public as RSAPublicKey) })
        verify(mockFileManager).writeToFile(argWhere { it.name == "private_key.der" },
                argWhere { keyIsEqual(it, result.private as RSAPrivateKey) })
    }

    @Test
    fun `does not try to save KeyPair to disk if directory does not exists`() {
        val mockFileManager = mock<KeyFileManager> {
            on { exists(any()) } doReturn false
        }

        val result = KeyHelper.generateKeyPair(mockFileManager)

        assertThat(result.private).isInstanceOf(RSAPrivateKey::class.java)
        assertThat(result.public).isInstanceOf(RSAPublicKey::class.java)

        verify(mockFileManager, Times(0)).writeToFile(any(), any())
    }
}
