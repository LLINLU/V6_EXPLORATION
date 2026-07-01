class FileReporter {
	onRunStart() {
		// blank line to separate from previous output
		console.log("")
	}

	onTestResult(_test, testResult) {
		const hasFailures =
			testResult.numFailingTests > 0 || testResult.testExecError !== undefined
		const label = hasFailures ? "FAIL" : "PASS"
		console.log(`${label} ${testResult.testFilePath}`)

		// Show detailed error messages for failures
		if (hasFailures) {
			testResult.testResults.forEach((result) => {
				if (result.status === "failed") {
					console.log(`\n  ✕ ${result.fullName}`)
					result.failureMessages.forEach((message) => {
						// Filter out React warnings and console.error/log messages
						const filteredMessage = message
							.split("\n")
							.filter((line) => {
								return (
									!line.includes("console.error") &&
									!line.includes("console.log") &&
									!line.includes("Warning: An update to") &&
									!line.includes("When testing, code that") &&
									!line.includes("at printWarning") &&
									!line.includes("at error (node_modules") &&
									!line.includes("Learn more at https://reactjs.org")
								)
							})
							.join("\n")
						console.log(`    ${filteredMessage}`)
					})
				}
			})
		}
	}

	onRunComplete(_contexts, aggregatedResult) {
		const { numFailedTests, numPassedTests, numTotalTests } = aggregatedResult
		console.log("")
		console.log(
			`Totals: ${numFailedTests} failed, ${numPassedTests} passed, ${numTotalTests} total tests.`,
		)
	}
}

module.exports = FileReporter
