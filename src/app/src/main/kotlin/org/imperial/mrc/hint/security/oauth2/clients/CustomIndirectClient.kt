package org.imperial.mrc.hint.security.oauth2.clients

import org.pac4j.core.client.IndirectClient

interface CustomIndirectClient
{
    fun client(): IndirectClient
}