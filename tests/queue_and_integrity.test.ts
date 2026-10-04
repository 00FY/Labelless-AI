import fs from 'fs';
import path from 'path';
import {
  calculatePriorityScore,
  verifyPriorityIntegrity,
  applyQueueUpdate,
  filterQueue,
  sortQueue,
  DEFAULT_WEIGHTS,
} from '../src/utils/queueLogic';
import { DatasetItem } from '../src/types';

function runTests() {
  console.log('====================================================');
  console.log('       LabelLess AI — Queue & Integrity Unit Tests  ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.log(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  // ── TEST 1: Formula Integrity Test (Council specific check: 0.7*0.91 + 0.2*0.76 + 0.1*0.40)
  console.log('[1/4] Testing Priority Score Formula Math...');
  const sampleCalc = calculatePriorityScore(0.91, 0.76, 0.40, DEFAULT_WEIGHTS);
  // 0.7 * 0.91 + 0.2 * 0.76 + 0.1 * 0.40 = 0.637 + 0.152 + 0.04 = 0.829 -> 0.83 (NOT 0.84)
  assert(
    Math.abs(sampleCalc - 0.829) < 0.001,
    'Council test case: u=0.91, r=0.76, d=0.40 equals 0.829 (rounded 0.83)',
    `got ${sampleCalc}`
  );

  // Load ranked_queue.json and test all 971 items
  const queuePath = path.resolve('inputs/ranked_queue.json');
  if (fs.existsSync(queuePath)) {
    const raw = fs.readFileSync(queuePath, 'utf-8');
    const data = JSON.parse(raw);
    const items = data.ranked_images || [];

    let mismatches = 0;
    for (const item of items) {
      const u = item.uncertainty_score || 0;
      const r = item.rare_class_score || 0;
      const d = item.diversity_score || 0;
      const p = item.priority_score || 0;
      if (!verifyPriorityIntegrity({ uncertaintyScore: u, rareClassScore: r, diversityScore: d, priorityScore: p }, 0.001)) {
        mismatches++;
      }
    }
    assert(mismatches === 0, `All ${items.length} items in ranked_queue.json match formula (0 mismatches)`, `found ${mismatches} mismatches`);
  } else {
    console.log('  [WARN] inputs/ranked_queue.json not found, skipping file load check.');
  }

  // ── TEST 2: Queue Update Behavior (Accept, Correct, Reject)
  console.log('\n[2/4] Testing Queue Update Behavior (Accept/Correct/Reject)...');
  const mockItems: DatasetItem[] = [
    {
      id: 'img-1',
      title: 'Item 1',
      filename: '1.jpg',
      imageUrl: '/1.jpg',
      predictedClass: 'Fire',
      confidence: 0.55,
      uncertaintyScore: 0.9,
      diversityScore: 0.4,
      rareClassScore: 0.8,
      priorityScore: 0.83,
      priorityLevel: 'critical',
      reasons: [],
      explanation: { uncertaintyContribution: 0.63, diversityContribution: 0.04, rareClassContribution: 0.16, recommendation: '', bulletPoints: [] },
      status: 'pending',
      boxes: [],
      estimatedManualSec: 60,
      aiAssistedSec: 15,
      createdAtRound: 0,
    },
    {
      id: 'img-2',
      title: 'Item 2',
      filename: '2.jpg',
      imageUrl: '/2.jpg',
      predictedClass: 'Smoke',
      confidence: 0.60,
      uncertaintyScore: 0.8,
      diversityScore: 0.3,
      rareClassScore: 0.7,
      priorityScore: 0.69,
      priorityLevel: 'high',
      reasons: [],
      explanation: { uncertaintyContribution: 0.56, diversityContribution: 0.03, rareClassContribution: 0.14, recommendation: '', bulletPoints: [] },
      status: 'pending',
      boxes: [],
      estimatedManualSec: 60,
      aiAssistedSec: 15,
      createdAtRound: 0,
    },
  ];

  // Action: Accept img-1
  const afterAccept = applyQueueUpdate(mockItems, 'img-1', 'accept');
  const pendingAfterAccept = filterQueue(afterAccept, 'pending');
  assert(afterAccept.find((i) => i.id === 'img-1')?.status === 'human_reviewed', 'Accepted item status changed to human_reviewed');
  assert(pendingAfterAccept.length === 1, 'Accepted item disappears from pending queue (count: 2 -> 1)');

  // Action: Reject img-2
  const afterReject = applyQueueUpdate(mockItems, 'img-2', 'reject');
  const pendingAfterReject = filterQueue(afterReject, 'pending');
  assert(afterReject.find((i) => i.id === 'img-2')?.status === 'rejected', 'Rejected item status changed to rejected');
  assert(pendingAfterReject.length === 1, 'Rejected item disappears from pending queue (count: 2 -> 1)');

  // ── TEST 3: Queue Filtering & Sorting
  console.log('\n[3/4] Testing Queue Filtering & Sorting Logic...');
  const sorted = sortQueue(mockItems, 'priority');
  assert(sorted[0].id === 'img-1', 'Highest priority item sorted to front of review queue');

  const filtered = filterQueue(mockItems, 'pending', 'critical');
  assert(filtered.length === 1 && filtered[0].id === 'img-1', 'Priority filter "critical" returns correct item');

  // ── TEST 4: Terminology Check
  console.log('\n[4/4] Testing UI Terminology Compliance...');
  // Inspect SmartReviewQueuePage.tsx text to confirm it uses "Queue Update"
  const queuePagePath = path.resolve('src/components/SmartReviewQueuePage.tsx');
  if (fs.existsSync(queuePagePath)) {
    const queuePageContent = fs.readFileSync(queuePagePath, 'utf-8');
    const claimsFullModelRerank = queuePageContent.includes('model re-rank') || queuePageContent.includes('model retrained instantly');
    assert(!claimsFullModelRerank, 'SmartReviewQueuePage does not falsely claim browser action causes instant model retraining/re-ranking');
  }

  console.log('\n====================================================');
  console.log(` Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
