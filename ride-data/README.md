# Dataset Documentation

This document provides details about the datasets located in the `data_dump` directory, including their schema and usefulness for the Disneyland Line Predictor project.

---

## 1. Attendance Data (`attendance.csv`)

### Description
This dataset contains historical attendance records for various theme parks. While the project focuses on Disneyland, this broader dataset helps in understanding general theme park attendance trends and their correlation with dates, seasons, and events.

### Schema
| Column | Type | Description |
| :--- | :--- | :--- |
| `USAGE_DATE` | Date | The date of the attendance record (YYYY-MM-DD). |
| `FACILITY_NAME` | String | The name of the theme park or facility. |
| `attendance` | Integer | The total number of visitors on that date. |

### Usefulness
- **Trend Analysis**: Identifying peak days, weekends vs. weekdays, and seasonal patterns.
- **Predictive Modeling**: Serving as a feature for predicting wait times, as higher attendance usually correlates with longer lines.

---

## 2. Disney California Adventure Wait Times (`disney_wait_times.csv`)

### Description
This dataset contains high-frequency wait time observations for rides at Disney California Adventure. The data was collected every 15 minutes and spans from July 2024 to June 2025.

### Schema
| Column | Type | Description |
| :--- | :--- | :--- |
| `Land` | String | The thematic area of the park (e.g., Avengers Campus). |
| `Ride` | String | The name of the attraction. |
| `Wait Time` | Integer | The observed wait time in minutes. |
| `Local Time` | Timestamp | The exact date and time of the observation. |
| `Day of Week` | String | The day of the week (e.g., Monday). |

### Usefulness
- **Core Training Data**: This is the primary dataset for training the ML model to predict wait times for specific rides at specific times.
- **Temporal Patterns**: Understanding how wait times fluctuate throughout the day.
- **Ride Comparisons**: Analyzing which rides consistently have the longest wait times within different "Lands".

---

## Author's Note on Original Data
The project originally utilized data from *touringplans.com* (2012-2018) and *Queue-times.com*. These datasets provided a foundation for analyzing wait times across different seasons and parks, integrating metadata like event schedules and weather conditions to enhance predictive accuracy.

## Sources
- https://www.kaggle.com/datasets/ayushtankha/hackathon
- https://www.kaggle.com/datasets/tivory27/disney-california-adventure-wait-times