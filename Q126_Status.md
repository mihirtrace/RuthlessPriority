# Q1 2026 Coaching Brief

**Last Updated:** 2026-01-29
**Owner:** Mihir Kumar

---

## Current Situation (as of Jan 29)

### The Numbers
| Metric | Current | Target | Gap | Status |
|--------|---------|--------|-----|--------|
| Cameras Shipped | 142 | 3,000 | -95% | Critical |
| Conversion Rate | 70% | 90% | -20pp | Critical |
| Soccer Subs @ Game 0 | 1.49 (101 cameras) | 2.5 | -1.01 | Critical |
| Soccer Subs @ Game 1 | 1.88 (33 cameras) | 3.5 | -1.62 | Critical |
| Soccer Subs @ Game 3 | 2.45 (20 cameras) | 4.0 | -1.55 | Critical |
| Soccer Subs @ Game 5 | 2.29 (7 cameras) | 5.0 | -2.71 | Critical |

**We're 30% through Q1.**

---

## The Problems (Chip Away Daily)

### 1. Top of Funnel - Volume
**Problem:** Not enough people entering the checkout flow
**Current:** ~235 total checkouts in 26 days = 9/day
**Needed:** To hit 3000 shipped at 90% conversion = 3333 checkouts = 37/day
**Gap:** 4x more checkout volume needed

**Questions to ask daily:**
- What marketing ran yesterday?
- How many checkouts came in?
- What's working? What's not?

---

### 2. Checkout Conversion - The Leak
**Problem:** 30% of checkouts never become shipped cameras
**Current:** 70% conversion
**Target:** 90%
**Root cause:** 100% of Pending/Cancelled deals have zero roster
**Mitigation:** Slack automation live on Railway — Rue closing pending deals 3+ days old

**Breakdown:**
- 71 deals stuck in Pending (30%)
- 21 deals Cancelled (9%)
- 142 shipped (60%)

**Questions to ask daily:**
- How many pending deals converted yesterday?
- Did anyone reach out to stuck customers?
- What did we learn from those conversations?

---

### 3. Subscription Growth - Subs per Camera
**Problem:** Not hitting subscription targets at each game milestone - GAP IS MUCH WORSE THAN THOUGHT
**Current vs Target (Soccer):**
| Milestone | Current | Target | Gap |
|-----------|---------|--------|-----|
| Game 0 | 1.49 | 2.5 | -1.01 |
| Game 1 | 1.88 | 3.5 | -1.62 |
| Game 3 | 2.45 | 4.0 | -1.55 |
| Game 5 | 2.29 | 5.0 | -2.71 |

**Note:** Only 33 of 101 cameras have reached game 1, only 7 have reached game 5.

**Questions to ask daily:**
- What's driving subscription adds after game 1?
- Are coaches promoting subscriptions?
- Is the product compelling enough for parents to subscribe?

---

### 4. Camera Activation - Getting to Game 1
**Problem:** Some cameras never play a game
**Current:** 33 of 142 shipped cameras (23%) have played 1+ games
**Gap:** 109 cameras sitting idle

**Questions to ask daily:**
- How many cameras played their first game yesterday?
- What's blocking cameras from playing?
- Are teams set up but just haven't had games yet?

---

### 5. Churn - Losing Shipped Cameras
**Problem:** Some shipped cameras churn before activation
**Current:** Need to track Closed Lost rate over time

**Questions to ask daily:**
- Did any cameras churn yesterday?
- Why? (Non-payment, dissatisfaction, wrong fit?)

---

## Daily Standup Template

Every morning, answer these:

1. **Volume:** How many checkouts yesterday? (Target: 37/day)
2. **Conversion:** How many shipped? How many stuck in pending?
3. **Activation:** How many cameras played first game?
4. **Subscriptions:** Any notable subscription adds?
5. **Churn:** Did we lose any cameras?

---

## Weekly Focus Areas

**Week of Jan 27:**
- [x] Get Slack automation running on Railway (Lucas deployed; Rue closing 3+ day pending deals)
- [ ] Manual outreach to 45 deals stuck 8+ days
- [ ] Understand why people checkout without roster

**Ongoing:**
- [ ] Investigate checkout flow - can we require roster before payment?
- [ ] Understand what drives subscription adds after game 1
- [ ] Build top-of-funnel volume

---

## Actions Taken

### Jan 29
- Conversion improved to 70% (up from 60.4%)
- Slack automation deployed to Railway by Lucas
- Rue now actively closing pending deals 3+ days old
- Mihir owning top-of-funnel volume directly

**Today's Actions (Jan 29):**
1. [ ] Slack Gentry: pick 2-3 leagues, open checkouts this week (2 min)
2. [ ] Build channel attribution into Command Center dashboard (deep work)
3. [ ] Pull sales bot conversation data for landing page insights
4. [ ] Check in with Keren: what's running, daily spend, CPA

### Jan 26
- Built Q126 Command Center dashboard with targets
- Created Slack automation for pending deals (needs Railway deploy)
- Identified 66 stale pending deals for outreach
- Created this coaching folder

---

## Key Files

- Dashboard: `holotable/trace-dashboards/dashboards/q126_command_center/`
- Slack Alert: `pendingdeals/` repo (live on Railway)
- Company defs: `Company/Q1_CompanyDefinitions.md`
- This file: `Coaching/Q126_Status.md`

---

## The Math That Matters

To hit 3000 shipped cameras:
- At current 70% conversion → need 4286 checkouts → 48/day remaining
- At target 90% conversion → need 3333 checkouts → 37/day remaining
- **Current pace:** 9 checkouts/day

**Both problems need solving. Neither alone gets you there.**
