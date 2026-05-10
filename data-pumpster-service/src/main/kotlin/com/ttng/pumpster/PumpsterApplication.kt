package com.ttng.pumpster

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class DataPumpsterServerApplication

fun main(args: Array<String>) {
	runApplication<DataPumpsterServerApplication>(*args)
}
