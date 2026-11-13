import { expect, it, vi } from 'vitest';
import { accountAbout, asUserId } from '../../knowledge/identity';

const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock('@anthropic-ai/sdk', () => ({
  default: class { messages = { create }; },
}));

import { buildFromFreeText } from '../extract-free-text';

const ownerId = asUserId('fixture-owner');

function extract(rawText: string, relation?: string) {
  create.mockResolvedValueOnce({
    content: [{
      type: 'tool_use',
      input: { units: [{ family: 'ENTITY', label: 'Bistrot du Port', entityType: 'restaurant', relation }] },
    }],
  });
  return buildFromFreeText({
    ownerId, about: accountAbout(ownerId), rawText,
    fieldContext: 'Restaurant', timestamp: '2026-11-11T12:00:00Z',
  });
}

it.each([
  ['mention sans appréciation', 'On est passés devant le Bistrot du Port.', undefined],
  ['relation absente', 'Le Bistrot du Port.', undefined],
  ['relation hors vocabulaire', 'Le Bistrot du Port.', 'FAVORITE'],
])('conserve le reliquat pour une %s', async (_, rawText, relation) => {
  const result = await extract(rawText, relation);
  expect(result.evidences).toEqual([]);
  expect(result.source?.rawText).toBe(rawText);
  expect(result.openKnowledge).toMatchObject([{ subjectLabel: 'Bistrot du Port' }]);
});

it('conserve LIKE quand le modèle extrait une appréciation explicite', async () => {
  const result = await extract('J’ai aimé le Bistrot du Port.', 'LIKE');
  expect(result.evidences).toMatchObject([{ target_family: 'ENTITY', relation: 'LIKE' }]);
  expect(result.openKnowledge).toEqual([]);
});
