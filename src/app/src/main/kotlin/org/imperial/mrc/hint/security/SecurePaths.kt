package org.imperial.mrc.hint.security

enum class SecurePaths{

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
    };

    abstract fun pathList():List<String>;


}
