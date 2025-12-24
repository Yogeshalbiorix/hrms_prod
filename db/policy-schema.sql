CREATE TABLE IF NOT EXISTS public_holidays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL, -- YYYY-MM-DD
    name TEXT NOT NULL,
    year INTEGER NOT NULL,
    is_optional BOOLEAN DEFAULT 0
);

CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL, -- JSON or String
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial policy text if not exists
INSERT OR IGNORE INTO system_settings (key, value) VALUES ('leave_policy_text', '
<h3>5. Types of Leaves</h3>
<p>Albiorix Technology offers the following leave types:</p>
<ul>
<li>Paid Leave</li>
<li>Unpaid Leave</li>
<li>Emergency Leave</li>
<li>Paternity Leave</li>
<li>Maternity Leave</li>
<li>Public Holidays</li>
<li>Birthday / Marriage Anniversary Leave</li>
<li>Partial Day Leave</li>
</ul>

<h3>6. Leave Structure</h3>
<p><strong>Paid Leave</strong>: 15 leaves annually. Pending leaves can be carried forward.</p>
<p><strong>Unpaid Leave</strong>: Not restricted. Prior approval is mandatory.</p>
<p><strong>Emergency Leave</strong>: 1 per month. Counted as paid leave. Converts to unpaid leave once paid leave quota is exhausted.</p>
<p><strong>Paternity Leave</strong>: 15 days. Applicable post delivery.</p>
<p><strong>Maternity Leave</strong>: 90 days. Available to eligible employees.</p>
<p><strong>Public Holidays</strong>: 12 holidays per year.</p>
<p><strong>Birthday / Marriage Anniversary Leave</strong>: 1 leave per financial year.</p>
<p><strong>Partial Day Leave</strong>: 2 hours per month. Must be compensated within the same or following week.</p>

<h3>7. List of Public Holidays (2024)</h3>
<p>Please refer to the Holiday Calendar.</p>

<h3>8. Guidelines for Public Holidays</h3>
<ul>
<li>Employees are entitled to all listed public holidays</li>
<li>Working on holidays due to operational needs may result in compensatory leave</li>
<li>Any change in holidays will be communicated in advance</li>
<li>Unauthorized absence on public holidays may lead to disciplinary action</li>
</ul>

<h3>9. Guidelines for Emergency Leave</h3>
<ul>
<li>Only 1 emergency leave per month</li>
<li>Granted for urgent, unavoidable situations</li>
<li>Excess emergency leave becomes unpaid leave</li>
<li>Proof may be requested for frequent emergency leaves</li>
</ul>

<h3>10. Guidelines for Paid Leave</h3>
<ul>
<li>15 paid leaves annually</li>
<li>Accrual: 7.5 leaves from April–September, 7.5 leaves from October–March</li>
<li>Advance notice required:
<ul>
<li>1 day leave → 3 working days’ notice</li>
<li>2–3 days → 5 working days’ notice</li>
<li>More than 4 days → 10 working days’ notice</li>
<li>Wedding leave → Apply at least 1 month in advance</li>
</ul>
</li>
</ul>

<h3>11. Paid Leave During Probation</h3>
<ul>
<li>1 paid leave per month during probation</li>
<li>Joining dates affect eligibility:
<ul>
<li>1st–10th → 1 leave</li>
<li>11th–20th → 0.5 leave</li>
<li>After 20th → No leave</li>
</ul>
</li>
<li>Post probation → 1.25 leaves per month</li>
</ul>

<h3>12. Carry Forward & Settlement</h3>
<ul>
<li>Paid leaves can be carried forward from April</li>
<li>Unused leaves are cashed out during FNF</li>
<li>Salary deductions apply if leave balance is negative</li>
</ul>

<h3>13. Sandwich Leave Policy</h3>
<ul>
<li>Leave taken before and after weekends or holidays may be counted as sandwich leave</li>
<li>Applicable during August, October, and November (Diwali period)</li>
<li>Extra stretched sandwich leave is calculated based on total continuous days</li>
</ul>

<h3>14. Birthday / Marriage Anniversary Leave</h3>
<ul>
<li>1 leave per financial year</li>
<li>Must inform TL / HR in advance</li>
<li>If the date falls on a weekend, no extra benefit is provided</li>
<li>Not applicable after resignation</li>
<li>Must be applied at least 1 week in advance</li>
</ul>

<h3>15. Guidelines for Maternity Leave</h3>
<ul>
<li>Available to eligible female employees</li>
<li>36 days of service required</li>
<li>Doctor’s certificate mandatory</li>
<li>From 7th month onward, WFH is treated as full-time work</li>
<li>Eligible as early as 8 weeks before delivery</li>
</ul>
');
