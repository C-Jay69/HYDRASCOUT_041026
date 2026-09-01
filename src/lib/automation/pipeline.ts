/**
 * Step 8 — Campaign Automation orchestrator.
 *
 * When the user presses LAUNCH this pipeline executes every stage of the
 * build prompt in order, with per-stage retries, structured logging,
 * progress updates and a final stats snapshot:
 *
 *   1. Gather new property records   (sources.ts — 21 connectors + n8n hook)
 *   2. Categorize properties         (clean.ts / classifyRecord)
 *   3. Enrich contact information    (enrich.ts — confidence + audit log)
 *   4. Remove duplicates             (clean.ts + store cross-run dedupe)
 *   5. Score leads                   (score.ts)
 *   6. Build campaign lists          (buildCampaign)
 *   7. Send outreach                 (outreach.ts — real or simulated)
 *   8. Log every action              (run.logs + communications table)
 *   9. Track delivery status         (communication.status)
 *  10. Schedule follow-ups           (follow_ups + AI timing)
 */

import { AutomationConfig, AutomationRun, CampaignRecord, Communication, EnrichmentAudit, FollowUp, Lead, RawRecord, RunLogEntry, StageId } from './types';
import { collectFromWebhook, relevantSources } from './sources';
import { cleanAndDedupe } from './clean';
import { enrichLead } from './enrich';
import { scoreLead } from './score';
import { draftMessage, recommendChannel, suggestFollowUpDays, summarizeLead, aiConfigured } from './ai';
import { sendOutreach, simulateEngagement } from './outreach';
import { DEFAULT_TEMPLATES } from './templates';
import { getStore } from './store';
import { uid } from './rng';

const MAX_RECORDS_PER_RUN = 400;
const MAX_AI_LEADS = 12; // cap LLM calls per run
const STAGE_RETRIES = 2;

export function createRun(config: AutomationConfig): AutomationRun {
  return {
    id: uid('run_'),
    config,
    status: 'queued',
    currentStage: null,
    stagesDone: [],
    logs: [],
    stats: {
      rawRecords: 0, sourcesQueried: 0, afterDedupe: 0, duplicatesRemoved: 0,
      enriched: 0, enrichmentRejected: 0, campaignLeads: 0, outreachSent: 0,
      outreachFailed: 0, followUpsScheduled: 0, avgScore: 0, cost: 0,
    },
    campaignId: null,
    error: null,
    startedAt: new Date().toISOString(),
    finishedAt: null,
  };
}

class RunContext {
  constructor(public run: AutomationRun) {}
  private store = getStore();

  async log(level: RunLogEntry['level'], stage: RunLogEntry['stage'], message: string) {
    this.run.logs.push({ ts: new Date().toISOString(), level, stage, message });
    await this.store.updateRun(this.run);
  }

  async setStage(stage: StageId) {
    this.run.currentStage = stage;
    await this.store.updateRun(this.run);
  }

  async completeStage(stage: StageId) {
    this.run.stagesDone.push(stage);
    await this.store.updateRun(this.run);
  }
}

async function withRetry<T>(ctx: RunContext, stage: StageId, fn: () => Promise<T>): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= STAGE_RETRIES + 1; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (attempt <= STAGE_RETRIES) {
        await ctx.log('warn', stage, `Attempt ${attempt} failed (${msg}) — retrying...`);
        await new Promise((r) => setTimeout(r, 500 * attempt));
      }
    }
  }
  throw lastErr;
}

export async function executePipeline(run: AutomationRun): Promise<void> {
  const store = getStore();
  const ctx = new RunContext(run);
  const config = run.config;

  run.status = 'running';
  await store.updateRun(run);
  await ctx.log('info', 'system', `Pipeline started — backend: ${store.backend === 'supabase' ? 'Supabase (persistent)' : 'in-memory demo store'}.`);

  try {
    /* -------- Stage 1: collect -------- */
    await ctx.setStage('collect');
    const rawRecords = await withRetry(ctx, 'collect', async () => {
      const sources = relevantSources(config.leadTypes);
      await ctx.log('info', 'collect', `Querying ${sources.length} data sources across ${config.counties.length} counties in ${config.state}...`);
      const all: RawRecord[] = [];
      for (const county of config.counties) {
        const results = await Promise.allSettled(sources.map((s) => s.collect(county, config.state, config)));
        let countyTotal = 0;
        results.forEach((r, i) => {
          if (r.status === 'fulfilled') {
            all.push(...r.value);
            countyTotal += r.value.length;
          } else {
            ctx.log('warn', 'collect', `${sources[i].name} failed for ${county} County: ${r.reason}`);
          }
        });
        await ctx.log('info', 'collect', `${county} County: ${countyTotal} records retrieved.`);
      }
      // Optional external workflow (n8n / Make.com)
      try {
        const webhookRecords = await collectFromWebhook(config);
        if (webhookRecords.length) {
          all.push(...webhookRecords);
          await ctx.log('success', 'collect', `n8n webhook returned ${webhookRecords.length} additional records.`);
        }
      } catch (err) {
        await ctx.log('warn', 'collect', `n8n webhook failed: ${err instanceof Error ? err.message : err}`);
      }
      run.stats.sourcesQueried = sources.length;
      return all.slice(0, MAX_RECORDS_PER_RUN);
    });
    run.stats.rawRecords = rawRecords.length;
    await ctx.log('success', 'collect', `Collected ${rawRecords.length} raw property records.`);
    await ctx.completeStage('collect');

    /* -------- Stage 2: classify (embedded in clean, log separately) -------- */
    await ctx.setStage('classify');
    await ctx.log('info', 'classify', 'Categorizing records across 17 distress categories...');
    await ctx.completeStage('classify');

    /* -------- Stage 3: clean + dedupe -------- */
    await ctx.setStage('clean');
    const { leads: cleanedAll, duplicatesRemoved } = cleanAndDedupe(rawRecords, run.id);
    // Only keep leads matching at least one selected lead type
    const cleaned = cleanedAll.filter((l) => l.categories.some((c) => config.leadTypes.includes(c)));
    const filteredOut = cleanedAll.length - cleaned.length;
    await ctx.log('info', 'clean', `Normalized addresses, owner names and ZIPs; merged ${duplicatesRemoved} in-batch duplicates${filteredOut ? `; dropped ${filteredOut} records outside the selected lead types` : ''}.`);
    const upsert = await withRetry(ctx, 'clean', () => store.upsertLeads(cleaned));
    const leads = upsert.leads;
    run.stats.duplicatesRemoved = duplicatesRemoved + upsert.mergedWithExisting;
    run.stats.afterDedupe = leads.length;
    await ctx.log('success', 'clean', `${upsert.inserted} new properties added, ${upsert.mergedWithExisting} merged with existing CRM records (duplicate imports prevented).`);
    await ctx.completeStage('clean');

    /* -------- Stage 4: enrich -------- */
    await ctx.setStage('enrich');
    await ctx.log('info', 'enrich', `Skip tracing ${leads.length} owners (confidence threshold 60, full audit trail)...`);
    const audits: EnrichmentAudit[] = [];
    let enrichedCount = 0;
    let rejectedCount = 0;
    for (const lead of leads) {
      const { audit, accepted } = await enrichLead(lead, run.id);
      audits.push(audit);
      if (accepted) enrichedCount++;
      else rejectedCount++;
    }
    await withRetry(ctx, 'enrich', () => store.addAudits(audits));
    run.stats.enriched = enrichedCount;
    run.stats.enrichmentRejected = rejectedCount;
    await ctx.log('success', 'enrich', `${enrichedCount} owners enriched with contact info; ${rejectedCount} low-confidence matches rejected (see audit log).`);
    await ctx.completeStage('enrich');

    /* -------- Stage 5: score -------- */
    await ctx.setStage('score');
    for (const lead of leads) {
      lead.motivationScore = scoreLead(lead);
    }
    const useLLM = aiConfigured();
    const sorted = [...leads].sort((a, b) => b.motivationScore - a.motivationScore);
    await ctx.log('info', 'score', useLLM ? 'AI summaries enabled (LLM key detected) for top leads.' : 'No LLM key set — using built-in heuristic summaries.');
    for (let i = 0; i < sorted.length; i++) {
      const lead = sorted[i];
      lead.aiSummary = await summarizeLead(lead, useLLM && i < MAX_AI_LEADS);
      lead.recommendedChannel = recommendChannel(lead, config.channels);
    }
    for (const lead of leads) await store.saveLead(lead);
    run.stats.avgScore = leads.length ? Math.round(leads.reduce((s, l) => s + l.motivationScore, 0) / leads.length) : 0;
    await ctx.log('success', 'score', `Motivation scores assigned (avg ${run.stats.avgScore}/100). Highest-priority leads sorted first.`);
    await ctx.completeStage('score');

    /* -------- Stage 6: build campaign list -------- */
    await ctx.setStage('build_lists');
    const minScore = config.minScore ?? 0;
    const campaignLeads = sorted.filter((l) => l.motivationScore >= minScore);
    const campaign: CampaignRecord = {
      id: uid('camp_'),
      runId: run.id,
      name: config.campaignName || `${config.state} ${config.counties.join('/')} — ${new Date().toLocaleDateString()}`,
      channels: config.channels,
      status: 'sending',
      leadIds: campaignLeads.map((l) => l.id),
      stats: { sent: 0, delivered: 0, failed: 0, replies: 0, interested: 0, appointments: 0, cost: 0 },
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    await withRetry(ctx, 'build_lists', () => store.createCampaign(campaign));
    run.campaignId = campaign.id;
    run.stats.campaignLeads = campaignLeads.length;
    await ctx.log('success', 'build_lists', `Campaign "${campaign.name}" built with ${campaignLeads.length} leads (min score ${minScore}).`);
    await ctx.completeStage('build_lists');

    /* -------- Stage 7: outreach -------- */
    await ctx.setStage('outreach');
    const providersLive = Boolean(process.env.SENDGRID_API_KEY || process.env.TWILIO_ACCOUNT_SID);
    await ctx.log('info', 'outreach', providersLive
      ? 'Live providers detected — sending through configured channels.'
      : 'No outreach provider keys set — running in SIMULATION mode (messages personalized & logged, nothing actually sent).');
    const comms: Communication[] = [];
    const followUps: FollowUp[] = [];

    for (const lead of campaignLeads) {
      const channel = lead.recommendedChannel && config.channels.includes(lead.recommendedChannel)
        ? lead.recommendedChannel
        : config.channels[0];
      const template = config.templates?.[channel] || DEFAULT_TEMPLATES[channel];
      const message = await draftMessage(lead, channel, template, useLLM && comms.length < MAX_AI_LEADS);
      const comm = await sendOutreach(lead, channel, message, run.id, campaign.id);
      comms.push(comm);

      if (comm.status === 'failed') {
        campaign.stats.failed++;
        run.stats.outreachFailed++;
        continue;
      }
      campaign.stats.sent++;
      campaign.stats.cost += comm.cost;
      run.stats.outreachSent++;
      run.stats.cost += comm.cost;
      if (comm.status === 'delivered') campaign.stats.delivered++;

      // Track (simulated) engagement so the funnel & CRM statuses are meaningful
      if (comm.simulated) {
        const eng = simulateEngagement(lead, channel);
        if (eng.appointment) { lead.status = 'appointment'; campaign.stats.appointments++; campaign.stats.replies++; campaign.stats.interested++; }
        else if (eng.interested) { lead.status = 'interested'; campaign.stats.interested++; campaign.stats.replies++; }
        else if (eng.replied) { lead.status = 'replied'; campaign.stats.replies++; }
        else lead.status = 'contacted';
      } else {
        lead.status = 'contacted';
      }
      await store.saveLead(lead);
    }
    await withRetry(ctx, 'outreach', () => store.addCommunications(comms));
    await ctx.log('success', 'outreach', `${run.stats.outreachSent} messages dispatched (${run.stats.outreachFailed} failed). Delivery status logged per lead.`);
    await ctx.completeStage('outreach');

    /* -------- Stage 8: follow-ups -------- */
    await ctx.setStage('followups');
    for (const lead of campaignLeads) {
      if (lead.status === 'dead') continue;
      const days = suggestFollowUpDays(lead);
      const dueAt = new Date(Date.now() + days * 86400000).toISOString();
      followUps.push({
        id: uid('fu_'),
        leadId: lead.id,
        runId: run.id,
        dueAt,
        reason: lead.status === 'interested' || lead.status === 'appointment'
          ? 'Hot lead — follow up personally'
          : `No response follow-up (${days}d cadence based on urgency)`,
        channel: 'call_task',
        done: false,
        createdAt: new Date().toISOString(),
      });
      lead.followUpAt = dueAt;
      await store.saveLead(lead);
    }
    await withRetry(ctx, 'followups', () => store.addFollowUps(followUps));
    run.stats.followUpsScheduled = followUps.length;
    await ctx.log('success', 'followups', `${followUps.length} follow-ups scheduled (timing suggested per lead urgency).`);
    await ctx.completeStage('followups');

    /* -------- done -------- */
    campaign.status = 'completed';
    campaign.completedAt = new Date().toISOString();
    await store.updateCampaign(campaign);

    run.status = 'completed';
    run.currentStage = null;
    run.finishedAt = new Date().toISOString();
    run.stats.cost = Math.round(run.stats.cost * 100) / 100;
    await store.updateRun(run);
    await ctx.log('success', 'system', `Pipeline complete in ${Math.round((Date.now() - new Date(run.startedAt).getTime()) / 1000)}s. ${run.stats.afterDedupe} leads in CRM, ${run.stats.outreachSent} outreach sent, ${run.stats.followUpsScheduled} follow-ups scheduled.`);
  } catch (err) {
    run.status = 'failed';
    run.error = err instanceof Error ? err.message : String(err);
    run.finishedAt = new Date().toISOString();
    await store.updateRun(run);
    await ctx.log('error', 'system', `Pipeline failed: ${run.error}`);
  }
}
