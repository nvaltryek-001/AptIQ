// Question-bank integrity tests. Run: npm test   (Node >= 18, no dependencies)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const bank = JSON.parse(fs.readFileSync(new URL('../src/data/questionBank.json', import.meta.url), 'utf8'));
const mirror = JSON.parse(fs.readFileSync(new URL('../data/questionBank.json', import.meta.url), 'utf8'));
const SECTIONS = ['Quantitative Aptitude', 'Logical Reasoning', 'Verbal Ability'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

// Same normalisation server.js uses before de-duplicating.
const norm = (t = '') => t.toLowerCase().trim()
  .replace(/^q\d+\s*(\[[^\]]+\]\s*:?)?\s*/i, '').replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();

test('bank has 840 records across 3 sections and 42 topics', () => {
  assert.equal(bank.length, 840);
  assert.deepEqual([...new Set(bank.map((q) => q.section))].sort(), [...SECTIONS].sort());
  assert.equal(new Set(bank.map((q) => q.module)).size, 42);
});

test('every question is well formed', () => {
  for (const q of bank) {
    assert.ok(q.id && q.question && q.explanation, `missing fields in ${q.id}`);
    assert.ok(DIFFICULTIES.includes(q.difficulty), `bad difficulty in ${q.id}`);
    assert.equal(q.options.length, 4, `${q.id} should have 4 options`);
    assert.equal(new Set(q.options).size, 4, `${q.id} has duplicate options`);
    assert.ok(q.options.includes(q.correctAnswer), `${q.id} answer not among options`);
    assert.ok(Number.isFinite(q.timeLimit) && q.timeLimit > 0, `${q.id} needs a positive timeLimit`);
  }
});

test('question ids are unique', () => {
  assert.equal(new Set(bank.map((q) => q.id)).size, bank.length);
});

test('after server de-duplication every topic still has at least 10 unique questions', () => {
  const seen = new Set();
  const perTopic = {};
  for (const q of bank) {
    const k = norm(q.question);
    if (seen.has(k)) continue;
    seen.add(k);
    perTopic[q.module] = (perTopic[q.module] || 0) + 1;
  }
  assert.equal(seen.size, 770, 'unique-question count changed: update README if intended');
  for (const [topic, n] of Object.entries(perTopic)) assert.ok(n >= 10, `${topic} has only ${n} unique questions`);
});

test('data/ mirror holds the same questions and answers as src/data/', () => {
  const byId = new Map(mirror.map((q) => [q.id, q]));
  assert.equal(mirror.length, bank.length);
  for (const q of bank) {
    const m = byId.get(q.id);
    assert.ok(m, `${q.id} missing from data/questionBank.json`);
    assert.equal(m.question, q.question);
    assert.equal(m.correctAnswer, q.correctAnswer);
    assert.deepEqual([...m.options].sort(), [...q.options].sort());
  }
});
