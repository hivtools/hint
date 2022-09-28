package org.imperial.mrc.hint.security.oauth2.clients

import org.pac4j.core.client.IndirectClient

class HintClientsContext(private val client: HintClients)
{
    fun getIndirectClient(): IndirectClient
    {
        return this.client.hintIndirectClient()
    }
}
