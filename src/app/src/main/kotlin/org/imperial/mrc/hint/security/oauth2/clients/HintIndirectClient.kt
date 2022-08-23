package org.imperial.mrc.hint.security.oauth2.clients

import org.pac4j.core.client.IndirectClient

class HintIndirectClient(private val client: CustomIndirectClient)
{
    fun getClient(): IndirectClient
    {
        return this.client.client()
    }
}