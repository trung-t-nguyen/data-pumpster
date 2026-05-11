package com.ttng.pumpster.service

import tools.jackson.databind.ObjectMapper
import tools.jackson.module.kotlin.readValue
import com.ttng.pumpster.domain.ImportJob
import com.ttng.pumpster.domain.ProgressEvent
import com.ttng.pumpster.repository.ImportJobRepository
import com.ttng.pumpster.web.dto.ImportJobSummary
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.apache.commons.csv.CSVFormat
import org.apache.commons.csv.CSVParser
import org.apache.commons.csv.CSVPrinter
import org.postgresql.copy.CopyManager
import org.postgresql.core.BaseConnection
import org.springframework.stereotype.Service
import reactor.core.publisher.Flux
import java.io.ByteArrayInputStream
import java.io.InputStreamReader
import java.io.StringWriter
import java.time.OffsetDateTime
import java.util.UUID
import javax.sql.DataSource

@Service
class ImportJobService(
    private val importJobRepository: ImportJobRepository,
    private val dataSource: DataSource,
    private val objectMapper: ObjectMapper,
    private val applicationScope: CoroutineScope,
    private val progressService: ProgressService,
) {
    companion object {
        private val STAGING_COLUMNS = listOf(
            "sku", "name", "price", "description",
            "currency", "category_id", "brand", "weight_kg", "is_active",
        )
        private val REQUIRED_FIELDS = listOf("sku", "name", "price")
    }

    suspend fun submitJob(fileBytes: ByteArray, mappingJson: String, totalRows: Int?): UUID =
        withContext(Dispatchers.IO) {
            val mapping: Map<String, String> = try {
                objectMapper.readValue(mappingJson)
            } catch (e: Exception) {
                throw IllegalArgumentException("Field 'mapping' is not valid JSON.")
            }

            for (field in REQUIRED_FIELDS) {
                if (mapping[field].isNullOrBlank()) {
                    throw IllegalArgumentException("Required mapping field '$field' is missing or empty.")
                }
            }

            val job = ImportJob(totalRows = totalRows)
            importJobRepository.save(job)

            progressService.createStream(job.id)

            applicationScope.launch(Dispatchers.IO) {
                processImport(job.id, fileBytes, mapping)
            }

            job.id
        }

    private fun processImport(jobId: UUID, fileBytes: ByteArray, mapping: Map<String, String>) {
        val job = importJobRepository.findById(jobId).orElseThrow {
            IllegalStateException("Import job $jobId not found")
        }
        job.status = "processing"
        importJobRepository.save(job)
        progressService.emit(jobId, "processing", totalRows = job.totalRows)

        try {
            val (insertedRows, skippedRows) = copyData(jobId, fileBytes, mapping)
            job.status = "completed"
            job.insertedRows = insertedRows
            job.skippedRows = skippedRows
            job.completedAt = OffsetDateTime.now()
            importJobRepository.save(job)
            progressService.emit(
                jobId, "completed",
                insertedRows = insertedRows, skippedRows = skippedRows, totalRows = job.totalRows,
            )
        } catch (e: Exception) {
            job.status = "failed"
            job.errorDescription = e.message ?: "Unknown error occurred during import."
            job.completedAt = OffsetDateTime.now()
            importJobRepository.save(job)
            progressService.emit(
                jobId, "failed",
                errorDescription = job.errorDescription, totalRows = job.totalRows,
            )
        }
    }

    suspend fun listJobs(): List<ImportJobSummary> =
        withContext(Dispatchers.IO) {
            importJobRepository.findAllByOrderByStartedAtDesc().map { job ->
                ImportJobSummary(
                    id = job.id,
                    status = job.status,
                    totalRows = job.totalRows,
                    insertedRows = job.insertedRows,
                    skippedRows = job.skippedRows,
                    errorDescription = job.errorDescription,
                    startedAt = job.startedAt,
                    completedAt = job.completedAt,
                )
            }
        }

    suspend fun streamJobEvents(jobId: UUID, afterEventId: Long?): Flux<ProgressEvent>? =
        withContext(Dispatchers.IO) {
            val job = importJobRepository.findById(jobId).orElse(null) ?: return@withContext null
            progressService.streamFrom(jobId, afterEventId) ?: buildTerminalFlux(job)
        }

    private fun buildTerminalFlux(job: ImportJob): Flux<ProgressEvent> =
        Flux.just(
            ProgressEvent(
                eventId = 1L,
                status = job.status,
                insertedRows = job.insertedRows,
                skippedRows = job.skippedRows,
                totalRows = job.totalRows,
                errorDescription = job.errorDescription,
            ),
        )

    private fun copyData(jobId: UUID, fileBytes: ByteArray, mapping: Map<String, String>): Pair<Int, Int> {
        dataSource.connection.use { conn ->
            val wasAutoCommit = conn.autoCommit
            conn.autoCommit = false

            try {
                conn.createStatement().use { stmt ->
                    stmt.execute(
                        """
                        CREATE TEMP TABLE products_stage (
                            sku TEXT, name TEXT, price TEXT, description TEXT,
                            currency TEXT, category_id TEXT, brand TEXT,
                            weight_kg TEXT, is_active TEXT
                        ) ON COMMIT DROP
                        """.trimIndent(),
                    )
                }

                val stagingCsv = buildStagingCsv(fileBytes, mapping)

                val copyManager = CopyManager(conn.unwrap(BaseConnection::class.java))
                val columnsClause = STAGING_COLUMNS.joinToString(", ")
                copyManager.copyIn(
                    "COPY products_stage ($columnsClause) FROM STDIN WITH (FORMAT CSV, NULL '')",
                    stagingCsv.byteInputStream(Charsets.UTF_8),
                )

                val insertedRows = conn.prepareStatement(
                    """
                    INSERT INTO products (sku, name, price, description, currency, category_id, brand, weight_kg, is_active, job_id, created_at, updated_at)
                    SELECT
                        sku,
                        name,
                        price::NUMERIC(12,2),
                        NULLIF(description, ''),
                        NULLIF(currency, ''),
                        NULLIF(category_id, '')::BIGINT,
                        NULLIF(brand, ''),
                        NULLIF(weight_kg, '')::NUMERIC(8,3),
                        COALESCE(NULLIF(is_active, '')::BOOLEAN, TRUE),
                        ?::UUID,
                        NOW(),
                        NOW()
                    FROM products_stage
                    ON CONFLICT (sku) DO NOTHING
                    """.trimIndent(),
                ).use { stmt ->
                    stmt.setString(1, jobId.toString())
                    stmt.executeUpdate()
                }

                val totalStaged = conn.createStatement().use { stmt ->
                    stmt.executeQuery("SELECT COUNT(*) FROM products_stage").use { rs ->
                        rs.next()
                        rs.getInt(1)
                    }
                }

                conn.commit()
                return Pair(insertedRows, totalStaged - insertedRows)
            } catch (e: Exception) {
                conn.rollback()
                throw e
            } finally {
                conn.autoCommit = wasAutoCommit
            }
        }
    }

    private fun buildStagingCsv(fileBytes: ByteArray, mapping: Map<String, String>): String {
        val reader = InputStreamReader(ByteArrayInputStream(fileBytes), Charsets.UTF_8)
        val inputFormat = CSVFormat.DEFAULT.builder()
            .setHeader()
            .setSkipHeaderRecord(true)
            .setIgnoreEmptyLines(true)
            .build()

        val writer = StringWriter()
        val printer = CSVPrinter(writer, CSVFormat.DEFAULT)

        CSVParser.parse(reader, inputFormat).use { parser ->
            for (record in parser) {
                val row = STAGING_COLUMNS.map { col ->
                    val csvHeader = mapping[col]
                    when {
                        csvHeader.isNullOrBlank() -> ""
                        record.isMapped(csvHeader) -> record.get(csvHeader) ?: ""
                        else -> ""
                    }
                }
                printer.printRecord(row)
            }
        }

        printer.flush()
        return writer.toString()
    }
}
