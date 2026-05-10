# UC-01 — Upload a Product CSV File

**Status:** ⬜ Not started
**Actor:** Data Operator
**Goal:** Bring an external CSV file of product data into the system in preparation for import.

---

## Business Context

Data operators regularly receive product catalogues from suppliers or internal teams as CSV exports. Before any data can reach the product database, the system must accept the file and verify it is a valid, parseable CSV — without making the browser unresponsive on large files.

---

## Preconditions

- The operator is on the Import page.
- The operator has a CSV file ready on their local machine.

---

## Main Success Scenario

1. The operator drags a CSV file onto the upload zone, or clicks to browse and select one.
2. The system confirms the file is a `.csv` and begins reading it in the background (non-blocking).
3. The system displays a processing indicator while it extracts the column headers and counts the total number of data rows.
4. The system presents the operator with the list of detected CSV column headers and the estimated row count.
5. The system advances the operator to the column mapping step (UC-02).

---

## Alternative Flows

**A — Wrong file type**
- At step 2: the file is not a `.csv`.
- The system rejects the file and shows: *"Only CSV files are accepted. Please select a .csv file."*
- The operator returns to step 1.

**B — Large file (> 500 MB)**
- At step 3: the file exceeds 500 MB.
- The system shows a non-blocking warning: *"Large file detected. Import may take several minutes."*
- The flow continues normally from step 3.

**C — File is empty or has no headers**
- At step 3: PapaParse finds no header row.
- The system shows: *"This file appears to be empty or has no column headers."*
- The operator returns to step 1.

---

## Postconditions

- The CSV file object is held in the browser (not yet sent to the server).
- The detected headers and row count are available for UC-02 and UC-03.

---

## Business Rules

- BR-01: Only `.csv` files are accepted; all other formats are rejected immediately.
- BR-02: File parsing must not freeze the browser UI (Web Worker required).
- BR-03: The file is not transmitted to the server during this step — no data leaves the browser yet.
