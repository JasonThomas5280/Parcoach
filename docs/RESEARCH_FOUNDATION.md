# Research Foundation

This document is the *why* behind every product rule. If a design decision can't be traced to
something here, question it. Citations are real and checkable — keep them honest in any pitch.

## The single most important finding: the transfer (video) deficit

Children younger than ~3 learn **more slowly from 2D screens than from real life**, and have
trouble **transferring** what they see on a screen to the 3D world (and vice versa). The effect is
strongest under age 3 and fades as children get older, though exactly when it disappears is
unsettled. ([Strouse & Samson 2021 review, summarized in Heimann et al. 2021, *Frontiers in
Psychology*](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2020.576940/full))

**Product consequence:** a screen, by itself, is a *weak* teacher for this age. So the app must not
try to be the teacher. It must (a) be co-played and (b) deliberately bridge back to the real
world. This is why the **real-world bridge end card is a P0 feature, not a nicety.**

## What actually helps: joint media engagement (co-play)

Parent–child joint engagement with media — co-viewing, co-use, scaffolding — is linked to better
learning and social outcomes; the parent helps the child understand what's on screen, directs
attention to what matters, and connects it to real life. ([systematic review of JME and
parent–child interaction, ResearchGate 2020](https://www.researchgate.net/publication/342986991);
[Sundqvist/Heimann et al. on parent-supported 2D learning](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2020.576940/full))

A concrete example: ~30-month-olds learned more new words watching *with* a parent modeling than
watching alone. ([cited in Heimann et al. 2021](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2020.576940/full))

**Product consequence:** the parent is the active ingredient. Co-play prompts, parent voice, and a
parent dashboard aren't add-ons — they're the mechanism of action. Solo-play stickiness is an
anti-goal.

## The familiar voice matters (and it's a feature *and* a moat)

For 24-month-olds, scripted verbal cues worked whether they came from a present parent or a
**prerecorded voice** — i.e., a familiar/known recorded voice can scaffold learning even when the
parent isn't narrating live. ([Barr & Wyss 2008, cited in Heimann et al. 2021](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2020.576940/full))

**Product consequence:** *record-your-own-voice* is research-aligned, not a gimmick. It also
creates emotional lock-in (a parent's recordings of their own child's first words) — a rare moat
for a kids' app, built ethically rather than through dark patterns.

## Current pediatric guidance (2026) is a tailwind for *this* design and a headwind for generic baby apps

In 2026 the AAP released its first major update in ~10 years, shifting **away from rigid time
limits toward quality, context, and conversation** (a "5 Cs" framing). It explicitly warns about
platforms engineered to maximize engagement (autoplay, endless scroll) and emphasizes co-viewing,
talking about content, and modeling. The under-18-month "no solo screens except video chat"
consensus holds; 18–24 months is "high-quality content, co-viewed with a caregiver." ([CHOC summary
of AAP 2026](https://health.choc.org/updated-aap-recommendations-for-screen-time/);
[EdSurge on the 2016→2026 shift](https://www.edsurge.com/news/2026-02-05-new-aap-screen-time-recommendations-focus-less-on-screens-more-on-family-time);
[AAP Center of Excellence](https://www.aap.org/en/patient-care/media-and-children/center-of-excellence-on-social-media-and-youth-mental-health/qa-portal/qa-portal-library/qa-portal-library-questions/screen-time-guidelines/))

**Product consequence:** an app whose thesis is "brief, co-played, then go outside" sits on the
*right* side of the new guidance. A generic "educational baby app the kid uses alone" sits on the
wrong side. This is the whole positioning. Note honestly: Jeremiah at 18 months is at the very edge
of the recommended band — the app is for **co-play, briefly**, full stop.

## How an 18–36-month-old actually works (design constraints)

- **Cause-and-effect is the dominant joy.** Tap → reliable, immediate result. This is the core
  mechanic; nothing else is needed to delight.
- **The naming explosion is starting (~18 mo).** Receptive vocabulary far exceeds expressive.
  Children love hearing familiar things named. → single-word labels, clearly spoken.
- **Attention is seconds to a couple of minutes.** → short loops, no dead ends, gentle advance.
- **Motor control is gross, not fine.** → enormous tap targets, forgiving hit areas, no precise
  drags or multi-touch.
- **No concept of points, rules, winning, or losing.** → "points" are meaningless to the child and
  belong on the *parent's* screen only. No child-facing scores, ever.
- **Needs predictability and emotional safety.** → consistent feedback, no jarring surprises, no
  failure, no time pressure visible to the child.
- **Learns through joint attention** — shared gaze, pointing, naming with a trusted adult. → the
  parent prompt and the bridge are how the app participates in that, instead of competing with it.

## Design principles that fall out of the research

1. **The parent is the product; the screen is the prop.**
2. **Cause-and-effect + labeling beats "education."**
3. **End on purpose. Bridge to the real world.** (Directly targets the transfer deficit.)
4. **Familiar voice over polished narration.**
5. **No engagement-maximizing mechanics — they're the thing the guidance warns against.**
6. **Emotional safety: no fail, no rush, no scores for the child.**
7. **Calm over stimulating.** Designed to wind a moment *down*, not crank it up.

## Honest limits of the evidence

The JME literature is encouraging but mixed, and much of it generalizes from older TV-viewing
research; effects depend on the *quality* of parent interaction, not mere presence. The app should
make good co-play easy, but it cannot manufacture it — and we should never overclaim "Tandem makes
your baby smarter." The honest claim is narrower and stronger: *Tandem is built the way the
research says shared media for toddlers should be built.* Keep marketing claims inside that line.
