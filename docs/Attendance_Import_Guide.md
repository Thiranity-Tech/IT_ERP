# Attendance Import Guide

Use this format when uploading attendance from Excel.

## Required Columns

- `employeeId`
- `date`
- `checkIn`
- `checkOut`

## Optional Columns

- `remarks`

## Notes

- `employeeId` must match the employee code used in the Users table.
- `date` should be a valid Excel date or a string parseable by the app.
- `checkIn` and `checkOut` should be valid date-time values.
- Late arrival and overtime are calculated from the Admin attendance timing settings.
- Rows with unknown employees are skipped.

## Example

| employeeId | date | checkIn | checkOut | remarks |
| --- | --- | --- | --- | --- |
| QA001 | 2026-07-08 | 2026-07-08 09:12 | 2026-07-08 18:20 | Late by traffic |
| DEV001 | 2026-07-08 | 2026-07-08 09:00 | 2026-07-08 18:05 | Normal day |
