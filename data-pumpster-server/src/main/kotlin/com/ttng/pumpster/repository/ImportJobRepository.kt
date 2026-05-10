package com.ttng.pumpster.repository

import com.ttng.pumpster.domain.ImportJob
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface ImportJobRepository : JpaRepository<ImportJob, UUID>
