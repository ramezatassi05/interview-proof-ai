import { test, expect } from '@playwright/test';

const REPORT_ID = process.env.E2E_TEST_REPORT_ID;

test.describe('M4 — practice session + prep_plan_tasks (P8 + P9)', () => {
  test.beforeEach(async () => {
    if (!REPORT_ID) test.skip(true, 'E2E_TEST_REPORT_ID not set');
  });

  test('PATCH practice-session sets ended_at', async ({ request }) => {
    // Open or create a session via GET (lazily creates one).
    const getRes = await request.get(`/api/report/${REPORT_ID}/practice-session`);
    expect(getRes.ok()).toBeTruthy();
    const session = (await getRes.json()).data as { id: string; endedAt: string | null };
    expect(session.id).toBeTruthy();

    // Close it.
    const patchRes = await request.patch(`/api/report/${REPORT_ID}/practice-session`, {
      data: { sessionId: session.id, summary: { source: 'e2e_smoke' } },
    });
    expect(patchRes.ok()).toBeTruthy();
    const closed = (await patchRes.json()).data as { id: string; endedAt: string | null };
    expect(closed.endedAt).not.toBeNull();

    // Idempotency: a second close returns 404 (session already closed).
    const second = await request.patch(`/api/report/${REPORT_ID}/practice-session`, {
      data: { sessionId: session.id },
    });
    expect(second.status()).toBe(404);
  });

  test('prep-plan-tasks sync round-trip', async ({ request }) => {
    const clientTasks = [
      {
        id: 'e2e-task-a',
        title: 'E2E task A',
        category: 'study',
        dayOffset: 0,
        estimatedMinutes: 30,
      },
      {
        id: 'e2e-task-b',
        title: 'E2E task B',
        category: 'practice',
        dayOffset: 1,
        estimatedMinutes: 45,
      },
    ];

    const syncRes = await request.post(`/api/report/${REPORT_ID}/prep-plan-tasks`, {
      data: { clientTasks },
    });
    expect(syncRes.ok()).toBeTruthy();
    const synced = (await syncRes.json()).data as {
      planId: string;
      clientIdToTaskId: Record<string, string>;
      completedClientTaskIds: string[];
    };
    expect(synced.planId).toBeTruthy();
    expect(synced.clientIdToTaskId['e2e-task-a']).toBeTruthy();

    const taskUuid = synced.clientIdToTaskId['e2e-task-a'];

    const patchRes = await request.patch(`/api/report/${REPORT_ID}/prep-plan-tasks`, {
      data: { taskId: taskUuid, status: 'done' },
    });
    expect(patchRes.ok()).toBeTruthy();

    // Re-sync — completedClientTaskIds should now include e2e-task-a.
    const reSync = await request.post(`/api/report/${REPORT_ID}/prep-plan-tasks`, {
      data: { clientTasks },
    });
    const reSynced = (await reSync.json()).data as { completedClientTaskIds: string[] };
    expect(reSynced.completedClientTaskIds).toContain('e2e-task-a');
  });
});
