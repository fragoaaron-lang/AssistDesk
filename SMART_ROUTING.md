# Smart Routing and Department Ticket Workflow

## Routing sources and algorithm

Ticket routing uses FAQ questions/answers/keywords and service names/requirements, together with the submitted concern category, subject, and description. Each matching normalized token contributes 2 points to a department; the highest FAQ or service match per department is used.

Automatic routing is accepted only when:

- the best department score is at least **5**; and
- the best score exceeds the runner-up by at least **2** points.

The stored `routing_confidence` is a heuristic score (`best score / 12`, capped at 1), **not a calibrated probability**. The stored `routing_method` is `automatic`, `user_selected`, or `corrected`; `suggested_department_id` preserves the original suggestion when a user selects another department or staff later corrects the route.

If the request does not reach both thresholds and no department was explicitly selected, the API rejects automatic ticket creation and asks the requester to choose a department. It does not silently route to department ID 1. A requester can always select a valid department manually; student department-access rules still apply.

Routing edits are administered through the FAQ and service catalog. Keep FAQ keywords, service names, requirements, and department ownership accurate: they are the routing vocabulary.

## Priority and ETA policy

Allowed priorities are `low`, `medium`, and `urgent`. New tickets default to `medium`. The standard ETA defaults are 72 hours for low, 48 hours for medium, and 24 hours for urgent. When an unresolved ticket passes its ETA, the system escalates it to urgent. Authorized department staff can also raise priority manually; manual escalation records a reason/action in the ticket history.

## Assignment and workflow permissions

- Staff see tickets routed to their department; admins see their authorized department (or all departments for an unscoped admin).
- Active staff in the routed department can accept an unassigned ticket or reassign it to another active staff member in that same department. Admins can assign, reassign, or unassign department tickets.
- Admins can change student, faculty, or staff department membership from the user directory. A staff member cannot be moved while they have active tickets assigned outside the destination department; those tickets must be reassigned first.
- A department staff member can correct routing from a ticket in their department. Admins can correct routing within their authorized scope. A routing correction clears the old assignment and records old/new department IDs, actor, timestamp, and optional reason.
- Accepting an open ticket moves it to `pending`. Further status changes are authorized for admins/staff in scope and must advance one step at a time: `open` → `pending` → `in_progress` → `resolved` → `closed`.
- Authorized staff can post updates, set ETA, and escalate priority. Requesters cannot change workflow status.

## Audit and future improvement

`ticket_updates.action`, `updated_by`, `created_at`, `department_id`, and `previous_department_id` record ticket actions and department corrections. `tickets.suggested_department_id`, `routing_confidence`, `routing_method`, and the final `department_id` allow routing decisions to be reviewed. Compare corrected predictions to final destinations when curating FAQ/service keywords or evaluating a future routing model.

Requester deletion is blocked for tickets with a department-correction audit entry, and terminating an account retains its ticket/audit records while removing account notifications and chat history.

Example review query (MySQL):

```sql
SELECT t.id, t.subject, t.routing_method, t.routing_confidence,
       suggested.name AS suggested_department,
       actual.name AS final_department,
       tu.updated_by, tu.created_at, tu.message
FROM tickets AS t
LEFT JOIN departments AS suggested ON suggested.id = t.suggested_department_id
JOIN departments AS actual ON actual.id = t.department_id
LEFT JOIN ticket_updates AS tu
  ON tu.ticket_id = t.id AND tu.action = 'department_rerouted'
WHERE t.suggested_department_id IS NOT NULL
  AND (t.department_id <> t.suggested_department_id OR t.routing_method = 'corrected')
ORDER BY t.updated_at DESC;
```

The server adds routing and audit columns for existing installations during startup. New installations receive the columns through Sequelize model sync.
