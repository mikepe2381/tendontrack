import type { TreatmentType } from "@/lib/schemas/profile";

export type EvidenceLevel = "high" | "moderate" | "low" | "expert_opinion";

export type MilestonePhase =
  | "acute"
  | "early_rehab"
  | "mid_rehab"
  | "return_to_activity";

export const MILESTONE_PHASES: MilestonePhase[] = [
  "acute",
  "early_rehab",
  "mid_rehab",
  "return_to_activity",
];

export const MILESTONE_PHASE_LABELS: Record<MilestonePhase, string> = {
  acute: "Acute / immobilization",
  early_rehab: "Early rehab",
  mid_rehab: "Mid rehab",
  return_to_activity: "Return to activity",
};

export const EVIDENCE_LABELS: Record<EvidenceLevel, string> = {
  high: "High",
  moderate: "Moderate",
  low: "Low",
  expert_opinion: "Expert opinion",
};

export type MilestoneTemplate = {
  key: string;
  label: string;
  phase: MilestonePhase;
  expected_week_min: number;
  expected_week_max: number;
  what_to_expect: string;
  source: string;
  evidence_level: EvidenceLevel;
};

// Citations referenced below (kept here so reviewers can cross-check):
//   Willits 2010  — Willits K, Amendola A, Bryant D, et al. Operative vs nonoperative
//                   treatment of acute Achilles ruptures with accelerated functional
//                   rehabilitation. JBJS 2010;92(17):2767-2775.
//   Soroceanu 2012 — Soroceanu A, Sidhwa F, Aarabi S, et al. Surgical vs nonsurgical
//                    treatment of acute Achilles rupture: meta-analysis. JBJS Am
//                    2012;94(23):2136-2143.
//   Ochen 2019    — Ochen Y, Beks RB, van Heijl M, et al. Operative vs nonoperative
//                   treatment of Achilles tendon ruptures: systematic review and
//                   meta-analysis. BMJ 2019;364:k5120.
//   AAOS          — AAOS Clinical Practice Guideline, Management of Acute Achilles
//                   Tendon Rupture (most recent published edition).
//   Shaw 2017     — Shaw G, Lee-Barthel A, Ross ML, Wang B, Baar K. Vitamin C-enriched
//                   gelatin supplementation before intermittent activity augments
//                   collagen synthesis. Am J Clin Nutr 2017;105(1):136-143.

const SURGICAL_TEMPLATES: MilestoneTemplate[] = [
  {
    key: "cast_removal",
    label: "Cast / splint removal",
    phase: "acute",
    expected_week_min: 1,
    expected_week_max: 2,
    what_to_expect:
      "Most modern post-op protocols swap the initial splint or cast for a functional walking boot with heel wedges within the first two weeks. The wound is checked, sutures may come out, and you usually start gentle ankle range-of-motion (plantarflexion, no forced dorsiflexion past neutral). Swelling and stiffness are still high — keep elevating and icing.",
    source: "Willits 2010; AAOS Clinical Practice Guideline on acute Achilles rupture.",
    evidence_level: "moderate",
  },
  {
    key: "boot_transition",
    label: "Transition to walking boot",
    phase: "acute",
    expected_week_min: 2,
    expected_week_max: 3,
    what_to_expect:
      "You'll typically move into a tall walking boot set in roughly 20°–30° of plantarflexion using 2–3 heel wedges. This is the start of accelerated functional rehabilitation: protected motion in the boot speeds recovery without raising re-rupture risk versus rigid casting.",
    source: "Willits 2010 (accelerated functional rehab vs cast immobilization).",
    evidence_level: "high",
  },
  {
    key: "partial_weight_bearing",
    label: "Partial weight bearing (in boot)",
    phase: "acute",
    expected_week_min: 2,
    expected_week_max: 4,
    what_to_expect:
      "With surgeon clearance, you'll begin loading the leg partially in the boot — usually progressing from toe-touch to roughly 50% bodyweight over a couple of weeks, often with crutches. The wedges keep the tendon in a shortened position so the repair isn't stretched.",
    source: "Willits 2010; Soroceanu 2012.",
    evidence_level: "high",
  },
  {
    key: "full_weight_bearing_in_boot",
    label: "Full weight bearing in boot",
    phase: "early_rehab",
    expected_week_min: 4,
    expected_week_max: 6,
    what_to_expect:
      "By this point most surgical patients on a modern protocol can walk fully on the booted leg without crutches, still with the heel wedges in. You may notice the calf has visibly atrophied — that's expected and reversible. Formal physical therapy is usually well underway.",
    source: "Willits 2010; AAOS guidance on early weight bearing.",
    evidence_level: "high",
  },
  {
    key: "wedge_reduction_complete",
    label: "Heel wedges removed",
    phase: "early_rehab",
    expected_week_min: 6,
    expected_week_max: 8,
    what_to_expect:
      "Wedges are typically removed one at a time over a couple of weeks until the boot sits flat. This is when the tendon starts taking on more tensile load. Expect new soreness as the calf and tendon adapt — this is part of the rehab signal, not a setback, but flag any sharp pain to your team.",
    source: "Willits 2010; standard accelerated functional protocols.",
    evidence_level: "moderate",
  },
  {
    key: "transition_to_shoe",
    label: "Out of the boot, into a shoe",
    phase: "mid_rehab",
    expected_week_min: 8,
    expected_week_max: 12,
    what_to_expect:
      "Most people transition out of the boot somewhere in weeks 8–12, often using a temporary heel lift inside a regular shoe for a few more weeks. Walking gait normalises gradually. Calf strength is still markedly lower than the uninjured side — this gap typically persists for many months.",
    source: "Soroceanu 2012; Ochen 2019.",
    evidence_level: "moderate",
  },
  {
    key: "driving_cleared",
    label: "Cleared to drive",
    phase: "mid_rehab",
    expected_week_min: 6,
    expected_week_max: 9,
    what_to_expect:
      "If the affected side is the right (or you drive a manual), brake reaction time generally returns to safe baseline somewhere around weeks 6–9 post-op. Left-Achilles patients driving an automatic can often resume much earlier (roughly weeks 2–4) once out of narcotic pain meds. Always confirm with your surgeon and check local rules — insurers may require explicit clearance.",
    source:
      "Consensus from post-op driving / brake reaction time literature; no single definitive trial. Confirm with your surgeon.",
    evidence_level: "expert_opinion",
  },
  {
    key: "stationary_bike",
    label: "Stationary bike (low resistance)",
    phase: "early_rehab",
    expected_week_min: 2,
    expected_week_max: 6,
    what_to_expect:
      "Light stationary cycling — often done with the boot on initially, then without — is commonly introduced early as a low-load way to move the ankle and maintain cardiovascular fitness. Resistance and duration are progressed gradually.",
    source: "Standard physiotherapy practice; not directly evidence-graded.",
    evidence_level: "expert_opinion",
  },
  {
    key: "return_to_jogging",
    label: "Return to jogging",
    phase: "return_to_activity",
    expected_week_min: 16,
    expected_week_max: 26,
    what_to_expect:
      "Light jogging usually returns somewhere in months 4–6, gated by calf strength, single-leg heel-raise capacity, and absence of tendon pain. Rushing this is one of the most common ways to re-injure. A graded return-to-running program (walk/jog intervals) is standard.",
    source: "Willits 2010 long-term outcomes; consensus return-to-sport criteria.",
    evidence_level: "moderate",
  },
  {
    key: "return_to_cutting_sports",
    label: "Return to cutting / jumping sports",
    phase: "return_to_activity",
    expected_week_min: 36,
    expected_week_max: 52,
    what_to_expect:
      "Most patients are cleared for cutting, pivoting, and jumping sports somewhere in months 9–12, contingent on functional testing (hop tests, heel-raise endurance, side-to-side symmetry). Calf strength deficits of 10–30% commonly persist past one year — this is a strong predictor of how confidently you'll return.",
    source: "Soroceanu 2012; Ochen 2019; AAOS return-to-play guidance.",
    evidence_level: "moderate",
  },
];

const NON_SURGICAL_TEMPLATES: MilestoneTemplate[] = [
  {
    key: "boot_with_wedges",
    label: "Boot with heel wedges",
    phase: "acute",
    expected_week_min: 0,
    expected_week_max: 2,
    what_to_expect:
      "Non-operative management starts immediately with the foot held in plantarflexion — usually a tall walking boot with 2–3 heel wedges — to bring the torn ends of the tendon close together while they begin to heal. Strict immobilisation, elevation, and ice dominate the first couple of weeks.",
    source: "Willits 2010; Soroceanu 2012; Ochen 2019.",
    evidence_level: "high",
  },
  {
    key: "partial_weight_bearing",
    label: "Partial weight bearing (in boot)",
    phase: "acute",
    expected_week_min: 2,
    expected_week_max: 4,
    what_to_expect:
      "Protected partial weight bearing in the wedged boot typically starts around weeks 2–4 once the early healing phase is underway. Gentle non-weight-bearing range-of-motion is usually permitted in this window too. Avoid passive stretching into dorsiflexion.",
    source: "Willits 2010; Ochen 2019 (modern functional non-op protocols).",
    evidence_level: "high",
  },
  {
    key: "full_weight_bearing_in_boot",
    label: "Full weight bearing in boot",
    phase: "early_rehab",
    expected_week_min: 4,
    expected_week_max: 8,
    what_to_expect:
      "Most non-operative patients reach full weight bearing in the boot by weeks 4–8, slightly later than the surgical pathway. Heel wedges remain in place until the tendon shows it can tolerate progressive loading without pain or lengthening.",
    source: "Willits 2010; AAOS Clinical Practice Guideline.",
    evidence_level: "moderate",
  },
  {
    key: "wedge_reduction_complete",
    label: "Heel wedges removed",
    phase: "early_rehab",
    expected_week_min: 8,
    expected_week_max: 10,
    what_to_expect:
      "Heel wedges come out one at a time, typically over 2–3 weeks, until the boot is flat. Going too fast risks tendon elongation, which can permanently weaken push-off — this is the main mechanical risk specific to the non-operative pathway.",
    source: "Consensus from accelerated functional non-op protocols.",
    evidence_level: "moderate",
  },
  {
    key: "transition_to_shoe",
    label: "Out of the boot, into a shoe",
    phase: "mid_rehab",
    expected_week_min: 10,
    expected_week_max: 14,
    what_to_expect:
      "Non-operative patients typically transition out of the boot a couple of weeks behind the surgical pathway, often with a temporary heel lift in a regular shoe. Calf strength is markedly reduced; expect months of progressive loading work before push-off feels normal.",
    source: "Soroceanu 2012; Ochen 2019.",
    evidence_level: "moderate",
  },
  {
    key: "return_to_jogging",
    label: "Return to jogging",
    phase: "return_to_activity",
    expected_week_min: 20,
    expected_week_max: 30,
    what_to_expect:
      "Light jogging usually returns somewhere in months 5–7 — slightly later than surgical, on average. Same gating criteria: tolerable single-leg heel raises, no tendon pain, gradual walk/jog progression supervised by your physio.",
    source: "Willits 2010; Ochen 2019.",
    evidence_level: "moderate",
  },
  {
    key: "return_to_cutting_sports",
    label: "Return to cutting / jumping sports",
    phase: "return_to_activity",
    expected_week_min: 40,
    expected_week_max: 60,
    what_to_expect:
      "Return to cutting and jumping sports is typically months 10–14 non-operatively. Modern meta-analyses show comparable long-term functional outcomes to surgery when accelerated functional rehab is followed — but re-rupture risk is modestly higher. Functional testing should gate this milestone, not the calendar alone.",
    source: "Soroceanu 2012; Ochen 2019; AAOS guidance.",
    evidence_level: "moderate",
  },
];

export function getMilestoneTemplates(
  pathway: TreatmentType,
): MilestoneTemplate[] {
  return pathway === "surgical"
    ? SURGICAL_TEMPLATES
    : NON_SURGICAL_TEMPLATES;
}

export function getMilestoneTemplate(
  pathway: TreatmentType,
  key: string,
): MilestoneTemplate | undefined {
  return getMilestoneTemplates(pathway).find((m) => m.key === key);
}

// ---------------------------------------------------------------------------
// Supplement evidence library
// ---------------------------------------------------------------------------

export type SupplementEvidenceLevel = "high" | "moderate" | "low" | "theoretical";

export const SUPPLEMENT_EVIDENCE_LABELS: Record<
  SupplementEvidenceLevel,
  string
> = {
  high: "High",
  moderate: "Moderate",
  low: "Low",
  theoretical: "Theoretical",
};

export type SupplementEvidence = {
  key: string;
  name: string;
  summary: string;
  evidence_level: SupplementEvidenceLevel;
  typical_dose: string;
  caveats: string;
  sources: string[];
};

// Sorted alphabetically by name at render time, but listed here grouped by
// rough evidence strength for easier review.
export const SUPPLEMENT_EVIDENCE: SupplementEvidence[] = [
  {
    key: "protein",
    name: "Protein (dietary)",
    summary:
      "Adequate total daily protein is the single best-supported nutritional lever for preserving muscle during immobilisation and rebuilding it during rehab. Spreading protein across the day (3–5 meals containing ~0.4 g/kg each) reliably increases muscle protein synthesis versus skewed intake.",
    evidence_level: "high",
    typical_dose:
      "1.6–2.2 g/kg body weight per day during rehab; the higher end if you're losing weight or training hard.",
    caveats:
      "Animal and dairy protein sources have a more complete amino acid profile; plant-based eaters typically need ~10–20% more total protein to match. Kidney disease changes this — discuss with your doctor.",
    sources: [
      "Wall BT, Morton JP, van Loon LJC. Strategies to maintain skeletal muscle mass in the injured athlete. Eur J Sport Sci 2015;15(1):53-62.",
      "Morton RW, Murphy KT, McKellar SR, et al. A systematic review, meta-analysis and meta-regression of protein supplementation on resistance training-induced gains in muscle mass and strength. Br J Sports Med 2018;52(6):376-384.",
    ],
  },
  {
    key: "collagen_vitamin_c",
    name: "Collagen + vitamin C",
    summary:
      "Hydrolysed collagen or gelatin taken ~30–60 minutes before short loading sessions (light rehab exercise, walking) appears to transiently increase collagen synthesis markers and may modestly improve tendon/ligament adaptation. Effect sizes are small and most evidence is from mechanistic and short-term studies, not long-term injury outcomes.",
    evidence_level: "moderate",
    typical_dose:
      "15–20 g hydrolysed collagen or gelatin + ~50 mg vitamin C, 30–60 min before rehab loading. Used alongside protein intake, not as a replacement for it.",
    caveats:
      "Does not replace total daily protein. Quality varies between brands. Watch added sugars in flavoured products.",
    sources: [
      "Shaw G, Lee-Barthel A, Ross ML, Wang B, Baar K. Vitamin C-enriched gelatin supplementation before intermittent activity augments collagen synthesis. Am J Clin Nutr 2017;105(1):136-143.",
      "Lis DM, Baar K. Effects of different vitamin C-enriched collagen derivatives on collagen synthesis. Int J Sport Nutr Exerc Metab 2019;29(5):526-531.",
    ],
  },
  {
    key: "vitamin_c",
    name: "Vitamin C",
    summary:
      "Vitamin C is an essential cofactor for prolyl and lysyl hydroxylase, the enzymes that crosslink collagen. Frank deficiency clearly impairs wound healing; supplementation above adequacy has not been shown to accelerate healing in well-nourished people. Most useful as part of a collagen-loading protocol or to correct low intake.",
    evidence_level: "moderate",
    typical_dose:
      "Total intake ~75–500 mg/day (food + supplement combined). No clear benefit to mega-dosing above ~1 g/day for tendon healing.",
    caveats:
      "Doses above ~1 g/day commonly cause GI upset. People with a history of kidney stones should be cautious.",
    sources: [
      "DePhillipo NN, Aman ZS, Kennedy MI, Begley JP, Moatshe G, LaPrade RF. Efficacy of vitamin C supplementation on collagen synthesis and oxidative stress after musculoskeletal injuries. Orthop J Sports Med 2018;6(10):2325967118804544.",
      "Shaw G et al. (collagen + vitamin C protocol, as above).",
    ],
  },
  {
    key: "vitamin_d",
    name: "Vitamin D",
    summary:
      "Low vitamin D status is consistently associated with worse musculoskeletal recovery, fracture healing, and muscle function. Correcting deficiency clearly helps; supplementing already-replete people probably does not. Worth checking serum 25(OH)D if you've not done so recently.",
    evidence_level: "moderate",
    typical_dose:
      "1000–2000 IU/day for maintenance in adults without measured deficiency; higher short-term doses only under medical guidance to correct a documented low level.",
    caveats:
      "Fat-soluble — chronic high doses (>4000 IU/day without monitoring) can cause hypercalcaemia. Check serum levels rather than dose-stacking.",
    sources: [
      "Holick MF. Vitamin D deficiency. N Engl J Med 2007;357(3):266-281.",
      "Shuler FD, Wingate MK, Moore GH, Giangarra C. Sports health benefits of vitamin D. Sports Health 2012;4(6):496-501.",
    ],
  },
  {
    key: "creatine",
    name: "Creatine monohydrate",
    summary:
      "One of the best-studied sports supplements. In immobilisation studies, creatine modestly attenuates muscle and strength loss in the immobilised limb and speeds re-gain during rehab. Effects are small but consistent and the safety profile is excellent in healthy adults.",
    evidence_level: "moderate",
    typical_dose:
      "3–5 g/day, taken at any time. No loading phase needed; saturation just takes longer (~3–4 weeks).",
    caveats:
      "Causes ~1–2 kg water-weight gain (mostly intramuscular). Hydrate normally. People with pre-existing kidney disease should discuss with their doctor; healthy kidneys handle it without issue.",
    sources: [
      "Hespel P, Op't Eijnde B, Van Leemputte M, et al. Oral creatine supplementation facilitates the rehabilitation of disuse atrophy. J Physiol 2001;536(Pt 2):625-633.",
      "Kreider RB, Kalman DS, Antonio J, et al. ISSN exercise & sports nutrition review update. J Int Soc Sports Nutr 2017;14:18.",
    ],
  },
  {
    key: "omega_3",
    name: "Omega-3 fatty acids (EPA/DHA)",
    summary:
      "Fish-oil-derived EPA and DHA have anti-inflammatory effects and a modest signal for improving muscle protein synthesis in older adults and during immobilisation. Direct evidence for tendon healing in humans is limited. May be useful as adjunct, not as a primary intervention.",
    evidence_level: "low",
    typical_dose:
      "Combined ~1.5–3 g/day EPA + DHA from a quality fish-oil or algal source.",
    caveats:
      "Mild blood-thinning effect — discuss with your surgeon, especially around any planned procedures. Fishy reflux is common; freezing capsules helps.",
    sources: [
      "Smith GI, Atherton P, Reeds DN, et al. Omega-3 polyunsaturated fatty acids augment the muscle protein anabolic response in older adults. Clin Sci (Lond) 2011;121(6):267-278.",
      "McGlory C, Calder PC, Nunes EA. The influence of omega-3 fatty acids on skeletal muscle protein turnover. Front Nutr 2019;6:144.",
    ],
  },
  {
    key: "magnesium",
    name: "Magnesium",
    summary:
      "Magnesium plays a role in muscle contraction, sleep, and bone metabolism, and correcting deficiency can help with cramps and sleep quality. Direct evidence that supplementation accelerates tendon healing is lacking; use is mostly a comfort and adequacy measure.",
    evidence_level: "theoretical",
    typical_dose:
      "200–400 mg/day of an elemental magnesium form like glycinate or citrate, often taken in the evening.",
    caveats:
      "Oxide and high doses of citrate can cause loose stools. Kidney disease changes safe dosing — check with your doctor.",
    sources: [
      "de Baaij JHF, Hoenderop JGJ, Bindels RJM. Magnesium in man: implications for health and disease. Physiol Rev 2015;95(1):1-46.",
      "Volpe SL. Magnesium and the athlete. Curr Sports Med Rep 2015;14(4):279-283.",
    ],
  },
];

// ---------------------------------------------------------------------------
// Educational framing — spec §5
// ---------------------------------------------------------------------------

export const CLINICAL_DISCLAIMER = {
  title: "Educational content, not medical advice.",
  body: "Recovery varies widely between individuals. Use this as a starting point for conversations with your surgeon and physiotherapist, not as a substitute for their guidance.",
};
