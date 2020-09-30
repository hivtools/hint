package org.imperial.mrc.hint.security.tokens

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import java.io.File
import java.security.*
import java.security.spec.PKCS8EncodedKeySpec
import java.security.spec.X509EncodedKeySpec
import java.util.*

object KeyHelper {

    private const val KEY_PATH = "/etc/hint/token_key"
    private const val KEY_SIZE = 1024

    private val keyFactory = KeyFactory.getInstance("RSA")
    private val logger: Logger = LoggerFactory.getLogger(KeyHelper::class.java)

    val keyPair by lazy {
        if (File(KEY_PATH, "private_key.der").exists()) {
            loadKeyPair()
        } else {
            generateKeyPair()
        }
    }

    fun loadKeyPair(): KeyPair {
        logger.info("Loading token signing keypair from $KEY_PATH")
        return KeyPair(loadPublicKey(), loadPrivateKey())
    }

    private fun loadPublicKey(): PublicKey {
        val keyBytes = File(KEY_PATH, "public_key.der").readBytes()
        val spec = X509EncodedKeySpec(keyBytes)
        return keyFactory.generatePublic(spec)
    }

    private fun loadPrivateKey(): PrivateKey {
        val file = File(KEY_PATH, "private_key.der")
        val keyBytes = file.readBytes()
        val spec = PKCS8EncodedKeySpec(keyBytes)
        return keyFactory.generatePrivate(spec)
    }

    // inject file manager wrapper to make unit testing possible
    fun generateKeyPair(fileManager: FileManager = KeyFileManager()): KeyPair {
        logger.info("Unable to find a token keypair at $KEY_PATH. Generating a new")
        logger.info("RSA keypair for token signing. If other applications need to")
        logger.info("verify tokens they should use the following public key:")
        val generator = KeyPairGenerator.getInstance("RSA").apply {
            initialize(KEY_SIZE)
        }
        val keypair = generator.generateKeyPair()
        val publicKey = Base64.getEncoder().encode(keypair.public.encoded)
        logger.info("Public key for token verification: " + publicKey)

        if (fileManager.exists(KEY_PATH)) {
            fileManager.writeToFile(File(KEY_PATH, "private_key.der"), keypair.private.encoded)
            fileManager.writeToFile(File(KEY_PATH, "public_key.der"), keypair.public.encoded)
        }
        return keypair
    }
}

class KeyFileManager: FileManager {

    override fun exists(path: String): Boolean {
        return File(path).exists()
    }

    override fun writeToFile(file: File, bytes: ByteArray) {
        file.createNewFile()
        file.writeBytes(bytes)
    }
}

interface FileManager {
    fun exists(path: String): Boolean
    fun writeToFile(file: File, bytes: ByteArray)
}
