package org.imperial.mrc.hint.security

enum class SecurePaths{

    // Secure paths for normal login authenticator
    ADD{
        override fun pathList(): List<String>
        {
            return listOf("/adr/**","/user/**","/project/**")
        }
    },
    EXCLUDE{
        override fun pathList(): List<String>
        {
            return listOf("/adr/schemas", "/adr/schemas/")
        }
    },
    // Secure paths for GitHub authenticator only
    ADD_GITHUB{
        override fun pathList(): List<String>
        {
            return listOf("/model/debug/**")
        }
    };

    abstract fun pathList():List<String>;


}
