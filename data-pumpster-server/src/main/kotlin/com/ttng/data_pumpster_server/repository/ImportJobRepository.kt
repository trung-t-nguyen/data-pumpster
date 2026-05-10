package com.ttng.data_pumpster_server.repository

import com.ttng.data_pumpster_server.domain.ImportJob
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface ImportJobRepository : JpaRepository<ImportJob, UUID>
