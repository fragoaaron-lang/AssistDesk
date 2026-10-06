# Non-Functional and AI Evaluation

## 1. Non-functional evaluation

The AssistDesk system was evaluated against the primary ISO/IEC 25010 quality characteristics relevant to a web-based student support system: usability, performance efficiency, security, reliability, compatibility, and maintainability.

### Usability

The application is designed to be straightforward for end users and staff. It provides role-specific pages for students, staff, and administrators, and it presents ticket workflows, department information, and reporting in a structured interface. The system includes filtering, dashboard visualizations, ticket status indicators, and admin audit views to improve usability and operational clarity.

### Performance efficiency

The system uses server-side filtering, summary queries, and capped result sets for analytics to reduce unnecessary processing. Ticket history and audit activity are paginated and constrained to recent results, and CSV export is reserved for admin reports. These design choices reduce load and help the application remain responsive under typical operational usage.

### Security

The system enforces authentication and authorization checks at the API layer, password hashing is implemented using bcryptjs, and account roles are restricted to the least-privilege functionality necessary for each user type. Audit logs preserve evidence of important events, and critical operations are protected by transaction handling.

### Reliability

The system includes validation checks, transactional updates, and audit snapshots to reduce partial or inconsistent system state. The server also performs startup backfill and schema checks to maintain compatibility with existing installations and reduce data-model drift.

### Compatibility

The system is built as a web application with separated frontend and backend services. It is designed to run in a browser environment while using a standard REST API and MySQL-backed persistence layer. This separation supports compatibility across supported client environments and server deployment scenarios.

### Maintainability

The project separates models, controllers, routes, middleware, and utilities, which improves clarity and enables more targeted changes when updating business logic, reporting, or routing behavior. The system also defines explicit model associations and utility-driven audit logging to keep responsibilities organized.

## 2. AI and routing evaluation

The routing component evaluates incoming ticket requests against known FAQ and service keyword patterns to suggest the most likely department. In the current implementation, the routing logic uses normalized tokens, score accumulation, and confidence thresholds. This is a transparent heuristic system rather than a formal trained machine learning model.

### Observable AI-related metrics

The project reports the routing logic in a documented, explainable manner rather than as a statistical machine-learning evaluation. The available evidence is operational and qualitative rather than a full benchmarking report. Relevant indicators include:

- department score accumulation based on FAQ and service matching
- confidence threshold checks using best score vs runner-up comparison
- stored routing metadata including `routing_method`, `routing_confidence`, and `suggested_department_id`
- audit trail records that allow review of corrected and deviated routing outcomes

### Reported limitations

The AI/routing component has several practical limitations:

- The system depends on curated FAQ/service keyword data, which can be incomplete or biased by outdated information.
- It relies on the quality of department vocabulary and keyword maintenance.
- Internet connectivity, server availability, and host environment affect live system responsiveness.
- The routing function is heuristic and not a formally trained or statistically validated model.
- Scalability depends on the maintained data set and the database performance of the underlying MySQL installation.

## 3. Evaluation design and respondent information

The project includes functional validation and operational behavior checks, but it does not include a formal survey-based evaluation instrument with respondents, sampling, instrument validation, rating scale, or statistical treatment. For a formal academic evaluation, the system would require:

- a defined respondent group (students, faculty, staff, administrators)
- a sampling method and sample size
- a validated questionnaire or Likert scale
- a clear statistical treatment method such as mean, frequency, or correlation analysis
- a summary of the results and their interpretation

This project currently provides technical validation evidence but not a full statistical user-evaluation package.

## 4. AI quality interpretation

Because the routing system is rule-based and explainable, results are interpreted as operational routing quality rather than as formal predictive model metrics. The system stores enough historical context to review if a suggestion was accepted, corrected, or rejected, which supports future model improvement without claiming formal machine-learning benchmark results.

## 5. Conclusion

The system demonstrates strong non-functional readiness in a practical engineering sense, especially in security, auditability, and maintainability. However, it does not yet contain the formal statistical evaluation, AI benchmark metrics, or respondent-based assessment required for a complete ISO/IEC 25010 and AI evaluation chapter. These sections should be completed with a formal survey plan and quantitative AI evaluation if the project requires full compliance with academic evaluation standards.
