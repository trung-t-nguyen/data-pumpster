package com.ttng.data_pumpster_server.config

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import org.springframework.beans.factory.DisposableBean
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class AppConfig : DisposableBean {
    private val supervisorJob = SupervisorJob()

    @Bean
    fun applicationScope(): CoroutineScope = CoroutineScope(supervisorJob + Dispatchers.Default)

    override fun destroy() {
        supervisorJob.cancel()
    }
}
