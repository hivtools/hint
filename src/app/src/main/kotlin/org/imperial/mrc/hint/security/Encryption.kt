package org.imperial.mrc.hint.security

import org.imperial.mrc.hint.security.tokens.KeyHelper
import org.springframework.stereotype.Component
import java.security.KeyPair
import javax.crypto.Cipher

@Component
class Encryption {

    val cipher: Cipher = Cipher.getInstance(ALGORITHM)
    val keyPair: KeyPair = KeyHelper.keyPair

    fun encrypt(plainText: String): String {
        cipher.init(Cipher.ENCRYPT_MODE, keyPair.public)
        return cipher.doFinal(plainText.toBytes()).toISOString()
    }

    fun decrypt(cipherText: String): String {
        cipher.init(Cipher.DECRYPT_MODE, keyPair.private)
        return cipher.doFinal(cipherText.toBytes()).toISOString()
    }

    private fun String.toBytes(): ByteArray {
        return this.toByteArray(Charsets.ISO_8859_1)
    }

    private fun ByteArray.toISOString(): String {
        return String(this, Charsets.ISO_8859_1)
    }

    companion object {
        const val ALGORITHM = "RSA/ECB/OAEPWithSHA1AndMGF1Padding"
    }
}
