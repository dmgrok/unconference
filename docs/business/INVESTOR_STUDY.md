# Unconference Platform Investor Study

**Date:** September 16, 2025  
**Prepared For:** Prospective Seed/Pre-Seed Investors & Strategic Partners  
**Prepared By:** Internal Strategy & Product Team  
**Confidentiality:** Proprietary – Not for external distribution without NDA

---
## 1. Executive Snapshot
**Strategic Thesis:** The unconference / participant‑driven event category is under-served by legacy registration or webinar tools that optimize logistics, not emergent collaboration. We are building the category-defining OST-native (Open Space Technology) operating system that converts ephemeral event energy into durable knowledge, networks, and measurable ROI.

**Current Status (Build Readiness):** ~40% functional breadth; deep strength in core unconference mechanics (voting, rounds, achievements, recap analytics, security hardening).  
**Near-Term Inflection:** Revenue protection + networking intelligence + PWA/mobile polish → unlocks paid tier conversion & viral loop acceleration.  
**Why Now:** Hybrid collaboration fatigue + budget scrutiny = demand for formats that produce higher engagement per dollar. OST adoption rising inside innovation, L&D, and community ecosystems.  
**Founder Advantage:** Modern codebase, clear architectural separation, strong velocity, and already instrumented for rapid feature layering (security, monitoring, modular feature flags, documentation discipline).

---
## 2. Problem & Opportunity
Traditional event platforms optimize attendance, not emergent value creation. High-value knowledge, serendipitous introductions, and action momentum are lost post-event. Organizers lack:
- Structured facilitation tooling for unconference dynamics
- Real-time insight into engagement & topic-market fit
- Native mechanisms to capture & operationalize outcomes
- Viral pathways to expand organizer and participant base

Participants lack:
- Intelligent matching ("who should I meet next?")
- Persistent context on conversations & follow-ups
- Recognition systems reinforcing contribution

Organizations lack:
- ROI instrumentation (collaboration formed, cross-silo knowledge shared)
- Repeatability frameworks for internal innovation cycles
- Secure, compliant, brand-aligned OST execution environment

**Opportunity:** Create the first vertically integrated Unconference → Knowledge Engine that:  
1. Orchestrates live emergent structure  
2. Captures interaction + knowledge exhaust  
3. Synthesizes post-event narratives & metrics  
4. Drives recurring utilization (events → knowledge graph → new events)

---
## 3. Market Landscape & Sizing (TAM / SAM / SOM)
### 3.1 Market Definition
We sit at the convergence of: (1) Event Management SaaS, (2) Corporate Innovation & L&D Enablement, (3) Knowledge Capture / Internal Intelligence Platforms, and (4) Professional Networking / Community Ops. Existing vendors optimize logistics or broadcast—not emergent, participant‑generated value.

### 3.2 Top‑Down Context
- Global Event Management Software (2024): ~$6.4B; hybrid momentum projects >$30B mid-term.
- Applicable corporate innovation / internal facilitation software slice: $5–7B.
- Structured professional networking & community enablement (adjacent): ~$2B emerging.

### 3.3 Focused TAM / SAM / SOM (Conservative)
| Layer | Definition | Core Assumptions | Est. Value |
|-------|------------|------------------|-----------|
| TAM | Global orgs & communities adopting emergent / unconference collaboration | ~500K relevant mid-market+ entities; 10% run ≥2 events/yr; $8K blended potential | ~$4.0B |
| SAM | NA + EU tech, academic innovation, professional associations | ~85K orgs; 15% early adopter fit; $6K initial ACV | ~$765M |
| SOM (24m beachhead) | Tech innovation teams + academic innovation offices + agile consultancies | ~9K targets; 3% penetration @ $5K ACV | ~$13.5M ARR |

### 3.4 Bottom‑Up Year 3 Illustration
1,200 customers (mix: 60% Pro @ $2.4K, 30% Enterprise @ $12K, 10% add-on heavy @ $6K blended) → weighted ACV ≈ $6.7K → ~$8M ARR (matches internal targets).

### 3.5 Demand Drivers
- Budget scrutiny → shift to higher engagement, measurable outcomes.
- Internal innovation cadence seeking structured repeatability.
- Talent retention & cross-silo knowledge transfer imperatives.
- Hybrid fatigue → experiential formats with ownership & agency.

### 3.6 Competitive Grid
| Segment | Representative | Strength | Gap (Our Wedge) |
|---------|---------------|---------|-----------------|
| Registration/Ticketing | Eventbrite | Scale, payments | No OST workflow, no knowledge lifecycle |
| Virtual Event Suites | Hopin / Airmeet | Production tooling | Heavy, linear, not emergent-native |
| Collaboration Suites | Notion / Miro / Slack | Persistent knowledge | No live facilitation orchestration layer |
| OST Niche Tools | Open Space Online | Method alignment | Weak UX, limited analytics & virality |
| Innovation Platforms | IdeaScale / Spigit | Idea governance | No real-time emergent session dynamics |

### 3.7 Differentiation Pillars
1. OST-native orchestration (rounds, voting, assignment) out-of-box.
2. Embedded networking intelligence & recap synthesis.
3. Viral professional artifacts (recaps, achievements) fueling organic growth.
4. Early security & monitoring maturity → enterprise trust signal.
5. Extensible architecture enabling knowledge graph evolution.

### 3.8 Defensibility Levers
- Structured interaction + expertise graph accumulation.
- Template & facilitator certification ecosystem.
- Post-event knowledge synthesis improving with scale (data moat).
- Future marketplace & integration depth (workflow gravity).

### 3.9 Strategic Optionality (3–5 Years)
Knowledge Graph API, cross-event benchmarking reports, curated “event packs” marketplace, predictive capacity & engagement optimization, enterprise retention analytics.

### 3.10 Early Validation Metrics (Targets)
Organizer repeat >50% (90d), recap share rate >30%, participant→organizer conversion 8–12%, upgrade conversion at cap >12%.

---
## 4. Product Architecture & Defensibility
### 4.1 Overview
Nuxt 3 + Vue 3 + TypeScript modular front-end with Prisma-backed data layer; ready for Postgres scale-out. Real-time pathways (Socket.io + yjs libraries already present) pre-position collaborative editing & presence features. Security middleware (rate limiting, CSRF, headers) and monitoring instrumentation create enterprise-aligned baseline unusually early.

### 4.2 Subsystem Snapshot
| Subsystem | Maturity | Notes | Strategic Leverage |
|-----------|----------|-------|--------------------|
| Auth & RBAC | High | Multi-provider OAuth, role tiers | SSO/SAML & audit logging upsell |
| Voting Engine | High | Weighted preferences + badges | Alternate schemas as premium options |
| Round Management | High | Timers, assignment, history | Multi-track & multi-day orchestration |
| Networking Graph | Medium | Connection strength algorithm | ML introductions & retention |
| Collaboration Workspace | Medium | Basic shared notes | Real-time CRDT editing + tasks |
| Achievements & Gamification | High | 15+ triggers & notifications | Viral & retention mechanics |
| Personal Recap / Analytics | High | Impact scoring + multi-mode views | Exec benchmarking & insights pack |
| Security & Monitoring | High | Threat detection, IP blocking | Compliance path acceleration |
| Revenue Protection | Low-Mid | Schema present, enforcement pending | Direct ARR unlock |
| Integrations | Low | Not yet implemented | Stickiness & ACV expansion |

### 4.3 Extensibility & Future-Proofing
Composable architecture + clear domain boundaries reduce marginal cost for shipping intelligence (recommendations, predictive analytics). Data model already normalizing interactions for future graph queries.

### 4.4 Key Gaps & Mitigations
| Gap | Risk | Mitigation (Next 2 Sprints) |
|-----|------|---------------------------|
| Participant cap unenforced | Revenue leakage | Middleware + UI upgrade prompts |
| Scale >300 concurrent untested | Unknown latency | Load test harness + performance budget |
| Accessibility not audited | Enterprise friction | WCAG 2.1 AA audit & remediation |
| Payments absent | Monetization delay | Stripe integration + license issuance service |
| Limited mobile offline/PWA | Engagement drag | Service worker + background sync |

### 4.5 Defensibility Summary
Compound defensibility: proprietary interaction & expertise graph + facilitator ecosystem + recap-driven viral loop + integration gravity. Architectural readiness accelerates intelligence-layer differentiation before generalist platforms can pivot.

---
## 5. Current Capability Matrix
| Pillar | Implemented Depth | Key Gaps | Monetization Leverage |
|--------|-------------------|----------|-----------------------|
| Core Unconference Mechanics | High | UX micro-polish (drag/drop voting) | Anchor value proposition |
| Networking Intelligence | Medium | Real-time suggestions | Pro / Growth tier driver |
| Knowledge Capture & Recap | High | Rich media & AI synthesis | Intelligence pack upsell |
| Gamification & Achievements | High | Referral tracking | Viral + retention engine |
| Collaboration Workspace | Medium | Real-time CRDT + tasks | Add-on module |
| Security & Monitoring | High | External audit artifacts | Enterprise readiness |
| Mobile / PWA | Medium | Offline & push notifications | Engagement + conversion |
| Revenue Enforcement | Low-Mid | Payment + gating | Immediate ARR unlock |
| Integrations | Low | Slack, Calendar, SSO | Stickiness & ACV expansion |
| Advanced Analytics | Medium | Benchmark dashboards | Executive upgrade |

---
## 6. Strategic Roadmap (12–24 Month Horizon)
| Phase | Months | Theme | Outcome Milestones |
|-------|--------|-------|--------------------|
| Phase 1 | 0–6 | Monetize & Engage | Cap enforcement, payments live, networking viz v1, PWA, recap virality instrumentation |
| Phase 2 | 6–12 | Intelligence Foundations | ML matching v1, Slack/Calendar integration, analytics dashboards, SSO groundwork |
| Phase 3 | 12–18 | Scale & Enterprise | 1K participant stability, white-label, API/webhooks, audit prep |
| Phase 4 | 18–24 | Knowledge Graph & Ecosystem | Cross-event insight graph, marketplace alpha, predictive facilitation engine |

Flywheel: Event Execution → Data Capture → Synthesis (recap, connections, achievements) → Share/Referral → New Organizers → Expanded Knowledge Graph → Higher Insight Quality → Enterprise Upgrades.

Milestone Gates: M1 (90d) 25 paying orgs; M2 (180d) $250K ARR; M3 (360d) $1M ARR & >115% NRR; M4 (24m) $2M+ ARR, enterprise deals ≥25% revenue.

---
## 7. Go-To-Market Motion & Growth Loops
Primary Channels (sequenced): Product-led free tier → Viral recap & achievement artifacts → Facilitator/consultancy partnerships → Thought leadership (OST ROI, knowledge retention) → Academic innovation labs.

Growth Loops:
1. Recap Share Loop (participant shares recap → new organizer signups)
2. Participant→Organizer Loop (positive first experience → event creation)
3. Achievement Share Loop (social badge → referral traffic)
4. Template Reuse Loop (successful format → increased event frequency)

Initial Funnel Targets: Visitor→Event Creation 5–7%; Cap Hit→Upgrade 12–18%; Recap Share Rate 30%+; Organizer 90d Retention 55%+.

Positioning: “Turn emergent event energy into measurable organizational knowledge & networks.”

---
## 8. Business & Monetization Model
Pricing Tiers (indicative annual): Free (49 participants, core); Pro ($1,068) adds networking & advanced recap; Growth ($3,228) adds analytics & template library; Enterprise (from $12K) adds SSO, white-label, API, compliance pack.

Add-ons: Intelligence Pack (AI synthesis), Integration Pack (Slack/Teams/Calendar), Data/API Premium, Facilitator Certification, Professional Services (10–15% rev early).

Revenue Mix Evolution: Year1 Subs 85% / Services 10% / Add-ons 5%; Year3 Subs 75% / Add-ons 15% / Marketplace 5% / Services 5%.

Early Monetization Priorities: (1) Cap enforcement, (2) Stripe & license issuance, (3) Billing dashboard & telemetry, (4) Recap attribution tracking, (5) Referral codes appended to share URLs.

---
## 9. Metrics Framework & Instrumentation Plan
North Star: Retained Knowledge Value per Event (composite: actionable connection rate + recap access rate + follow-up initiation).

Metric Hierarchy: Acquisition (site→event%), Activation (time to 1st round, vote participation), Engagement (connections/participant, rounds completed), Retention (organizer repeat, participant return), Monetization (upgrade at cap, ARPU, NRR), Advocacy (NPS, recap shares, achievement share CTR).

Instrumentation Backlog: Event lifecycle hooks; connection formation events; recap generation & share tracking; participant cap modal funnel; achievement unlock event bus.

Early Warning Indicators: Voting participation <65%; recap access <40%; cap conversion <5%; connection follow-up <30%.

---
## 10. Risk Register & Mitigation Program
| Category | Risk | Impact | Mitigation |
|----------|------|--------|-----------|
| Scale | Performance >300 concurrent unknown | High | Load tests + perf budget + caching |
| Monetization | Delayed billing integration | Medium | Parallel sprint; reduced scope MVP |
| Adoption | Perceived as “nice to have” | High | Emphasize ROI metrics & outcome analytics |
| Data Privacy | Enterprise / GDPR scrutiny | High | Privacy policy, DPA templates, export controls |
| Competitive | Feature mimic by suites | Medium | Accelerate knowledge graph + intelligence modules |
| Security | Vulnerability exploit | High | Dependency audit, external pen test Phase 2 |
| Churn Concentration | Few logo dependence | Medium | Segment diversification playbook |
| Focus | Roadmap sprawl | High | Quarterly OKRs + milestone gating |
| Hiring | Senior engineering lag | Medium | Fractional specialists + internal upskilling |

Compliance Path: Phase1 hardening (done) → Phase2 SOC2 readiness artifacts → Phase3 SOC2 Type I + SAML → Phase4 data residency & key management.

---
## 11. Resource & Capital Deployment Plan
Team Sequencing: 0–3m (Founding FS + fractional design + growth) → 3–6m (Backend, Frontend PWA, Product Designer) → 6–12m (Data Eng, ML, CS Lead, Sales Lead) → 12–18m (Enterprise AE, Solutions Eng, Compliance Lead) → 18–24m (Marketplace PM, Partner Manager, DevRel).

Use of Funds (Illustrative $1.2M): Product/Eng 48%, GTM 22%, Compliance 8%, Infra 7%, Community 5%, Buffer 10%.

Capital Efficiency Milestones: Month4 Monetize MVP ($50K ARR run-rate), Month8 Intelligence Foundations ($150K ARR), Month14 Enterprise Entry ($600K ARR), Month22 Ecosystem Launch ($1.5M ARR run-rate).

---
## 12. Investment Ask & Use of Funds
Raise Scenarios: Lean Seed $750K (14m runway) → Standard Seed $1.2M (20m) → Extended Seed $1.8M (24m + marketplace readiness).

Tranche Concept: 60% initial close (ship monetization + M1 metrics) / 40% performance tranche (ARR + retention thresholds).

Use Priorities: (1) Monetization infrastructure, (2) Growth loop instrumentation, (3) Knowledge graph pipeline, (4) Enterprise feature gate (SSO, export, audit logs), (5) Marketplace seeding.

Investor Return Narrative: Compound dataset + workflow lock-in + marketplace = premium multiple (target 6–8x forward ARR at Series A if intelligence adoption validated).

---
## 13. Appendices (Mapped Evidence)
To include cross-references:  
- PRD sections → capability claims  
- Security summary → enterprise readiness  
- Roadmaps → timeline credibility  
- Changelog → velocity proof  
- Data model excerpts → extensibility  

---
*Sections 3–12 populated; pending additions: baseline metric instrumentation snapshots, architectural diagram, anonymized beta testimonials, compliance timeline confirmation.*

### 13.1 Claims → Source Documentation Map
| Claim / Statement | Source Document(s) | Lineage / Notes |
|-------------------|--------------------|-----------------|
| ~40% functional breadth | `EXECUTIVE_SUMMARY.md` (Project Status) | Matches current capability summary |
| Security hardening implemented | `IMPLEMENTATION_SUMMARY.md`, `SECURITY.md` | Middleware + monitoring + CSRF features |
| Weighted voting & round automation | `PRODUCT_REQUIREMENTS_DOCUMENT.md` (Sections 3,4) | Verified implemented status flags ✅ |
| Achievement & recap systems fully implemented | PRD Sections 8–10 | Feature status marked FULLY IMPLEMENTED |
| Networking partial (connection strength, tracker) | PRD Section 5 | Items marked partially implemented 🟡 |
| Collaboration workspace partial | PRD Section 6 | Real-time editing gap listed |
| Work showcase partial | PRD Section 7 | CRUD & matching gaps noted |
| Revenue protection pending | PRD “Business Model & Revenue Protection” | Hard limits & payment gaps explicit |
| PWA / offline missing | PRD Mobile Experience Section | PWA + service worker not implemented |
| Performance >200 participants untested | PRD Performance & Scale | Benchmarking + CDN not done |
| Roadmap phases (monetize→intelligence→enterprise→knowledge graph) | `CORE_UNCONFERENCE_ROADMAP.md`, `ROADMAP_EVENT_TO_KNOWLEDGE.md` | Consolidated sequential themes |
| Knowledge graph future vision | `ROADMAP_EVENT_TO_KNOWLEDGE.md` Phase 3+ | Cross-event knowledge base & AI |
| Marketplace & plugin ecosystem | Executive Summary Future Vision, Roadmap | Long-term differentiation lever |
| Multi-provider OAuth implemented | PRD Auth Section | Implementation flagged ✅ |
| Monitoring & threat detection | Implementation Summary + Security docs | IP blocking, metrics export |
| Data export / privacy gaps | PRD Data Storage & Privacy | GDPR tools not yet implemented |
| Analytics dashboard gap | PRD Analytics & Reporting | Advanced dashboards missing |
| Accessibility compliance gap | PRD Accessibility Section | WCAG audit pending |
| Enterprise readiness path (SSO, white-label, compliance) | PRD Commercial Licensing Section | All listed as not implemented |

### 13.2 Feature Status Snapshot (Condensed)
| Pillar | Status (Exec/PRD) | Evidence Docs | Gap Focus |
|--------|------------------|--------------|-----------|
| Voting / Rounds | ✅ Implemented | PRD Sections 3–4 | UX polish |
| Networking | 🟡 Partial | PRD 5 | Real-time suggestions |
| Collaboration | 🟡 Partial | PRD 6 | Real-time editing backend |
| Work Showcase | 🟡 Partial | PRD 7 | CRUD + matching logic |
| Achievements | ✅ Full | PRD 8 | Referral tracking |
| Recap & Analytics | ✅ Full (recap) / 🟡 Partial (adv analytics) | PRD 9–10 | Advanced dashboards |
| Security & Monitoring | ✅ Full | Impl Summary, SECURITY.md | External audit artifacts |
| Mobile / PWA | 🟡 Partial | PRD Mobile Section | Offline + push |
| Revenue Protection | 🟡 Partial | PRD Revenue Protection | Enforcement + billing |
| Integrations | ❌ Not Implemented | PRD Integrations | Slack / Calendar / SSO |

### 13.3 Artifact Velocity Signals
| Evidence | File | Value to Investors |
|----------|------|-------------------|
| Changelog cadence | `docs/CHANGELOG.md` | Demonstrates sustained delivery velocity |
| Structured specs | `specs/001-plan-implementation/*` | Process maturity & planning rigor |
| Security checklist | `IMPLEMENTATION_SUMMARY.md` | Early enterprise discipline |
| Roadmap granular phases | `CORE_UNCONFERENCE_ROADMAP.md` | Clarity of execution sequencing |

### 13.4 Data Model / Extensibility Indicators
| Area | Indicator | Source |
|------|-----------|--------|
| Collaboration | Presence of yjs/prosemirror deps | `package.json` (yjs, y-prosemirror) |
| Analytics Readiness | MonitoringService abstraction | `server/utils/monitoringService.ts` (referenced) |
| Security Layer | Middleware modularization | `server/middleware/security.ts` |
| Future Integrations | Structured scripts & doc generation | `scripts/` & docs automation scripts |

### 13.5 Follow-Up Evidence To Attach (Next Revision)
| Artifact | Purpose |
|---------|---------|
| Architecture diagram (PNG / Mermaid export) | Visual clarity for technical diligence |
| Load test baseline report | Scale readiness proof |
| Accessibility audit summary | Enterprise procurement aid |
| Beta testimonial excerpts | Social proof / qualitative validation |
| Preliminary SOC2 readiness checklist | Compliance trajectory credibility |

### 13.6 Metrics Instrumentation Checklist (Engineering Backlog)
| Event Name | Trigger Point | Payload Fields (Min) | Metric Supported | Priority |
|------------|--------------|----------------------|------------------|----------|
| `event_created` | On successful creation | eventId, organizerId, planType | Acquisition, Activation | High |
| `event_published` | Status -> Active | eventId, topicsCount, roomsCount | Activation | High |
| `round_started` | Round timer start | eventId, roundNumber, topicsAssigned | Engagement | Medium |
| `round_completed` | Timer end | eventId, roundNumber, durationSec | Engagement, Retention | Medium |
| `topic_submitted` | Topic save | eventId, userId, topicLength | Engagement | High |
| `vote_cast` | Each vote | eventId, userId, topicId, weight | Engagement | High |
| `connection_created` | New connection record | eventId, userIdA, userIdB, strength | Networking Value | High |
| `connection_followup_marked` | Follow-up flagged | connectionId, eventId | Retained Value | Medium |
| `achievement_unlocked` | Achievement logic fires | userId, achievementType, eventId | Advocacy, Engagement | Medium |
| `recap_generated` | Recap API completion | eventId, participantsCount | Advocacy, Knowledge Value | High |
| `recap_accessed` | User views recap | eventId, userId | Knowledge Retention | High |
| `recap_shared` | Share action taken | eventId, platform, userId | Viral Loop, Acquisition | High |
| `participant_limit_reached` | At limit threshold | eventId, participantsCount, planType | Monetization | High |
| `upgrade_modal_viewed` | Upsell prompt shown | eventId, planType, participantsCount | Monetization Funnel | High |
| `upgrade_started` | Stripe checkout init | organizerId, planFrom, planTo | Monetization | High |
| `upgrade_completed` | Stripe webhook success | organizerId, newPlan, MRR | ARR Tracking | High |
| `pwa_install_prompt` | PWA install shown | userId, deviceType | Engagement | Low |
| `offline_queue_flush` | Sync after offline | eventId, queuedActionsCount | Reliability | Low |

Implementation Notes:
- Standardize event schema (ISO timestamp, uuid v4 ids, `source` field for future multi-client contexts).
- Emit to internal queue (e.g., lightweight event bus) then batch to analytics sink (Postgres table or external service later).
- Privacy: avoid storing PII beyond internal IDs; maintain user lookup separately.

Derivable Metrics Mapping:
- Organizer Repeat Rate = distinct organizers with ≥2 `event_created` in trailing 90 days / total active organizers.
- Share Rate = `recap_shared` unique user count / participants.
- Upgrade Conversion = `upgrade_completed` / `participant_limit_reached` (unique events).
- Actionable Connection Rate = connections with follow-up / total connections.

### 13.7 Architecture Diagram (Stub)

Mermaid Overview:
```mermaid
flowchart LR
	subgraph Client
		UI[Nuxt 3 / Vue 3 Components]
		SW[Service Worker / PWA]
	end
	UI -- REST / WebSocket --> API[Nuxt Server Routes]
	SW -- Sync / Offline Queue --> API
	API --> Auth[Auth & RBAC Layer]
	API --> Logic[Domain Services (Voting / Rounds / Recap / Achievements)]
	Logic --> Prisma[(Prisma ORM)]
	Prisma --> DB[(SQLite / PostgreSQL)]
	API --> Realtime[Socket.io Layer]
	Realtime --> UI
	Logic --> Monitor[Monitoring & Security Middleware]
	Monitor --> Logs[(Structured Logs)]
	Logic --> Events[(Analytics Event Queue)]
	Events --> Sink[(Analytics Store)]
```

ASCII (High-Level):
```
 +-----------+      HTTPS / WS      +------------------+       +-----------+
 |  Browser  | <------------------> |  Nuxt Server API |  -->  | Monitoring|
 | (Nuxt UI) | ---- offline sync -> |  (Routes + Auth) |  -->  |  & Sec    |
 +-----------+                      |   Domain Logic   |       +-----------+
			 |                            |    (Voting,      |             |
			 | WebSocket realtime         |  Rounds, Recap)  |             v
			 v                            +---------+--------+       +-----------+
	+---------+                                |                |  Logs /   |
	| Socket  | <------------------------------+                |  Metrics  |
	+---------+                                v                +-----------+
																		+------------------+
																		|   Prisma ORM     |
																		+---------+--------+
																							|
																				+------------+
																				|  SQLite /  |
																				| PostgreSQL |
																				+------------+

	(Planned) Event Bus → Analytics Sink / Future Stream Processing
```

Legend:
- Voting / Rounds / Recap = domain service modules invoked via server routes.
- Monitoring & Security = rate limiting, CSRF, headers, threat detection.
- Event Queue = future lightweight abstraction for instrumentation events.
- Realtime path enables collaborative editing (future yjs integration) & live updates.


