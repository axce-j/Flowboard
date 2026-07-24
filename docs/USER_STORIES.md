# Flowboard — User Stories (v3)

Format: `As a <role>, I want <capability>, so that <benefit>.` Each story has acceptance criteria. Roles: **Anyone** (unauthenticated), **User** (any logged-in person), **Owner**, **Admin**, **Member**.

> v3 changelog: renamed Cadence → Flowboard; split Epic 4 into org-wide topics (4.1) and team sub-topics (4.2), updated tagging rule (4.4); added bulk content import (5.9).

---

## Epic 1 — Identity & Auth

### 1.1 Sign up
As **Anyone**, I want to create an account with email + password, so that I have a Flowboard identity.
- [ ] `POST /auth/signup` creates a `User` (bcrypt-hashed password) and an `Organization` in one call
- [ ] Creator is auto-assigned `OrganizationMembership(role: owner, status: active)`
- [ ] Duplicate email → 409, not a silent overwrite
- [ ] Password strength validated (min length, not just "not empty")

### 1.2 Log in
As a **User**, I want to log in with email + password, so that I get access to my org(s).
- [ ] `POST /auth/login` validates credentials
- [ ] 1 active membership → JWT issued immediately, scoped to that org
- [ ] 2+ active memberships → short-lived pre-org token + list of orgs returned; must call `select-org` next
- [ ] Wrong password → 401, same error whether email exists or not (no user enumeration)

### 1.3 Switch organization
As a **User** in multiple orgs, I want to pick which org I'm operating in, so that my session is scoped correctly.
- [ ] `POST /auth/select-org` exchanges pre-org token + orgId for a full org-scoped JWT
- [ ] Rejects orgId not in the user's active memberships

### 1.4 Invite a teammate (existing user)
As an **Owner**, I want to invite someone by email who already has a Flowboard account, so that they join my org without creating a new password.
- [ ] System detects existing `User` by email
- [ ] Creates `OrganizationMembership(status: pending)` — does **not** count against their 4-org cap yet
- [ ] Sends "you've been invited to Org X" email
- [ ] Cap check happens on **acceptance**, not here

### 1.5 Invite a teammate (new user)
As an **Owner**, I want to invite someone who has never used Flowboard, so that they can create an account and join in one flow.
- [ ] Creates a signup token + pending membership placeholder
- [ ] Email contains a link to set a password and complete signup
- [ ] Completing signup activates the membership
- [ ] Owner never sees or sets the invitee's password (email-ownership verification via token click)

### 1.6 Accept an invite
As an invited **User**, I want to accept an invite, so that I gain access to the org.
- [ ] Accepting checks the 4-active-org cap; rejects with a clear error if exceeded
- [ ] On accept, membership flips `pending` → `active`, `joinedAt` set

### 1.7 Forgot password
As a **User**, I want to reset my password via email, so that I'm not locked out.
- [ ] `POST /auth/forgot-password` sends a time-limited reset token (never reveals whether the email exists)
- [ ] `POST /auth/reset-password` validates token + sets new password, invalidates the token after use

---

## Epic 2 — Organization & Membership

### 2.1 View org members
As an **Owner/Admin**, I want to see everyone in my org and their role/status, so that I can manage membership.
- [ ] Lists active and pending memberships, scoped to `req.user.orgId`

### 2.2 Change a member's role
As an **Owner**, I want to promote/demote a member's role, so that permissions match responsibility.
- [ ] Only `owner` can call this
- [ ] Cannot demote the last remaining owner (org must always have ≥1 owner)

### 2.3 Remove a member
As an **Owner/Admin**, I want to remove someone from the org, so that they lose access.
- [ ] Admin cannot remove an owner
- [ ] Removing a member does not delete their `User` — only the `OrganizationMembership`
- [ ] Their assigned content items are not deleted (see 6.x reassignment behavior)

---

## Epic 3 — Teams

### 3.1 Create a team
As an **Owner**, I want to create a team within my org, so that I can group content and people.
- [ ] Only `owner` role permitted (`RolesGuard`)
- [ ] Team is implicitly scoped to `req.user.orgId`

### 3.2 Assign members to a team
As an **Owner**, I want to add existing org members to a team, so that they can work on that team's content.
- [ ] Can only add users who already have an **active** membership in the same org
- [ ] `TeamMembership` join enforces no duplicates

### 3.3 View my teams
As a **User**, I want to see which teams I'm on, so that I know what content I have access to.
- [ ] Returns teams where the user has a `TeamMembership`, scoped to current org

---

## Epic 4 — Topics

### 4.1 Create an org-wide topic
As an **Owner**, I want to create a topic that's usable by every team in my org, so that content can be tagged consistently across teams for reporting.
- [ ] Owner-only, org-scoped
- [ ] Created with `teamId: null`
- [ ] Duplicate topic name among org-wide topics in the same org → 409

### 4.2 Create a team-scoped sub-topic
As an **Owner**, I want to create a topic that's only usable by one specific team, so that a team can have its own taxonomy without cluttering org-wide reporting.
- [ ] Owner-only for launch (see TECH_SPEC §8 for future role revisit)
- [ ] Created with `teamId` set to a team in the caller's org
- [ ] Duplicate topic name within the same team's sub-topics → 409 (independent of org-wide name collisions — a team sub-topic and an org-wide topic may share a name)

### 4.3 View available topics
As a **Member**, I want to see the topics I can tag content with, so that I pick the right one for the content's team.
- [ ] Returns all org-wide topics plus sub-topics belonging to teams the caller is a member of

### 4.4 Tag content with a topic
As a **Member**, I want to assign a topic to a content item, so that it's discoverable/reportable.
- [ ] `topicId` must belong to the same org as the content item
- [ ] If the topic is a team sub-topic (`teamId` set), it must match the content item's own `teamId` — a sub-topic from another team cannot be applied
- [ ] Nullable — content can exist without a topic

---

## Epic 5 — Content lifecycle

### 5.1 Create content
As a **Member**, I want to create a content idea within my team, so that I can start planning it.
- [ ] Requires membership on the target `teamId`
- [ ] Defaults `status: idea`
- [ ] `handledBy` defaults to the creator unless explicitly reassigned by an Owner/Admin

### 5.2 Edit content
As a **Member**, I want to edit content I'm handling, so that I can update details as work progresses.
- [ ] Members can edit only content where `handledBy = self` (or team-shared, per team config)
- [ ] Owner/Admin can edit anything in-org

### 5.3 Move content through status
As a **Member**, I want to change a content item's status (idea → draft → ready → posted), so that progress is visible.
- [ ] Every status change writes a `ContentStatusHistory` row (`fromStatus`, `toStatus`, `changedBy`, `changedAt`)
- [ ] Invalid transitions (e.g. `posted` → `idea` without explicit override) are rejected or flagged — **decide exact transition rules before Phase 3 build**

### 5.4 Delete content
As an **Owner/Admin**, I want to delete a content item, so that stale/duplicate entries don't clutter the board.
- [ ] Soft delete (`deletedAt`) — not a hard `DELETE`
- [ ] Deleted items excluded from default list/search/analytics queries

### 5.5 View content history
As an **Owner/Admin**, I want to see the full status history of a content item, so that I can audit what happened.
- [ ] `GET /api/content/:id/history` returns ordered `ContentStatusHistory` rows with actor names

### 5.6 List & filter content
As a **User**, I want to filter content by status, type, team, assignee, or topic, so that I can find what I need.
- [ ] Supports combinable query params
- [ ] Paginated (`page`, `limit`) and sortable (`sortBy`, `order`)
- [ ] Always scoped to `req.user.orgId`

### 5.7 Search content
As a **User**, I want full-text search on title/description, so that I can find content without knowing exact filters.
- [ ] `GET /api/content?search=...`

### 5.8 Bulk status update
As an **Owner/Admin**, I want to update the status of multiple content items at once, so that batch cleanup is fast.
- [ ] Accepts an array of IDs + target status
- [ ] Writes one `ContentStatusHistory` row per item (not a single bulk row) — audit trail stays granular

### 5.9 Bulk content import
As a **Member/Owner/Admin**, I want to create multiple content ideas in one request, so that I can seed a team's board quickly instead of entering items one at a time.
- [ ] `POST /api/content/import` accepts an array of content items shaped like the single-create DTO
- [ ] Each row is validated and inserted independently — **one bad row does not fail the whole batch**
- [ ] Response reports per-row outcome (created + id, or error + reason), so the caller knows exactly what succeeded
- [ ] Batch size is capped (e.g. 500 rows per request)
- [ ] Each created item gets a seed `ContentStatusHistory` row so its audit trail starts consistently with manually-created items
- [ ] Same team-membership and org/topic-scoping rules as single create apply per row

---

## Epic 6 — Analytics & Reporting

### 6.1 Content breakdown
As an **Owner/Admin**, I want counts of content by status/type/assignee/team, so that I can see where work is piling up.
- [ ] `GET /api/analytics` — org-scoped aggregation

### 6.2 Export
As an **Owner/Admin**, I want to export the current content calendar as CSV, so that I can share it outside Flowboard.
- [ ] `GET /api/content/export` streams CSV, respects active filters

---

## Epic 7 — Non-functional / platform

### 7.1 API docs
As a **Developer** (including future me), I want Swagger docs for the whole API, so that I can explore/test endpoints without reading source.
- [ ] `@nestjs/swagger` wired to existing DTOs, served at `/api/docs`

### 7.2 Input validation
As the **System**, I want all incoming payloads validated against DTOs, so that bad data never reaches the DB.
- [ ] Global `ValidationPipe` with whitelist + forbidNonWhitelisted

### 7.3 Consistent errors
As a **Developer**, I want every error response in the same shape, so that the frontend can handle them uniformly.
- [ ] Global exception filter

### 7.4 Rate limiting
As the **System**, I want to throttle repeated requests, so that brute-force login attempts and abuse are limited.
- [ ] `@nestjs/throttler`, tighter limits on `/auth/*`

### 7.5 Migrations
As a **Developer**, I want schema changes tracked as migrations, so that deploys are predictable and reversible.
- [ ] `synchronize: false` in all environments, TypeORM migrations checked into the repo
- [ ] One-time v1 data backfill (if needed) is a separate script, not part of this migration chain (see TECH_SPEC §9)

### 7.6 Tests
As a **Developer**, I want unit + e2e coverage on core flows, so that regressions are caught before deploy.
- [ ] Unit tests: auth service, org-membership cap logic, content service, bulk import partial-success behavior
- [ ] e2e: signup → invite → accept → create content → change status → verify history row
- [ ] e2e: bulk import with one intentionally-bad row → verify good rows created, bad row reported, no rollback of the good rows

### 7.7 Local dev via Docker
As a **Developer**, I want `docker-compose up` to give me the API + local Postgres, so that I'm not fighting RDS IP allowlists locally.
- [ ] `docker-compose.yml` with app + Postgres service
