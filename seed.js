#!/usr/bin/env node
// ============================================================
// EXAM PREP APP — SUPABASE SEED SCRIPT
// Seeds: exam, domains, los (with real Markdown content),
//        subtopics (tags only), lo_question_types
// Run: node seed.js
// Requires: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars
// ============================================================
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Supabase client (service role — bypasses RLS) ─────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('Key length:', SUPABASE_SERVICE_ROLE_KEY.length)
console.log('Key start:', SUPABASE_SERVICE_ROLE_KEY.substring(0, 20))
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
    }
  }
})
// ── Helper: read a markdown file ──────────────────────────────────────────
function readMd(filename) {
  return readFileSync(join(__dirname, 'lo_content', filename), 'utf-8')
}

// ── Helper: upsert with logging ───────────────────────────────────────────
async function upsert(table, data, conflictCol = 'id') {
  const { error } = await supabase
    .from(table)
    .upsert(data, { onConflict: conflictCol })
  if (error) {
    console.error(`  ERROR upserting into ${table}:`, error.message)
    throw error
  }
}

// ── Helper: upsert junction (composite PK) ────────────────────────────────
async function upsertJunction(table, data, conflictCols) {
  const { error } = await supabase
    .from(table)
    .upsert(data, { onConflict: conflictCols })
  if (error) {
    console.error(`  ERROR upserting into ${table}:`, error.message)
    throw error
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SEED DATA
// ═══════════════════════════════════════════════════════════════════════════

async function seed() {
  console.log('\n=== EXAM PREP APP — SEED SCRIPT ===\n')

  // ── 1. EXAM ────────────────────────────────────────────────────────────
  console.log('1. Seeding exam...')
  await upsert('exams', {
    id: '00000000-0000-0000-0000-000000000001',
    code: 'MLA-C01',
    title: 'AWS Certified Machine Learning Engineer — Associate',
    provider: 'Amazon Web Services',
    version: 'v1.0',
    passing_score: 720,
    status: 'published',
  }, 'code')
  console.log('   ✓ MLA-C01')

  // ── 2. DOMAINS ─────────────────────────────────────────────────────────
  console.log('\n2. Seeding domains...')
  const domains = [
    { id: '00000000-0000-0000-0001-000000000001', exam_id: '00000000-0000-0000-0000-000000000001', code: 'D1', title: 'Data Preparation for Machine Learning (ML)', weight_percent: 28, sort_order: 1 },
    { id: '00000000-0000-0000-0001-000000000002', exam_id: '00000000-0000-0000-0000-000000000001', code: 'D2', title: 'ML Model Development', weight_percent: 26, sort_order: 2 },
    { id: '00000000-0000-0000-0001-000000000003', exam_id: '00000000-0000-0000-0000-000000000001', code: 'D3', title: 'Deployment and Orchestration of ML Workflows', weight_percent: 22, sort_order: 3 },
    { id: '00000000-0000-0000-0001-000000000004', exam_id: '00000000-0000-0000-0000-000000000001', code: 'D4', title: 'ML Solution Monitoring, Maintenance, and Security', weight_percent: 24, sort_order: 4 },
  ]
  for (const d of domains) {
    await upsert('domains', d, 'code')
    console.log(`   ✓ ${d.code}: ${d.title}`)
  }

  // ── 3. LOS with real Markdown content ──────────────────────────────────
  console.log('\n3. Seeding LOs with Markdown content...')
  const los = [
    // Domain 1
    {
      id: '00000000-0000-0000-0002-000000000001',
      domain_id: '00000000-0000-0000-0001-000000000001',
      code: 'TS1.1',
      title: 'Ingest and Store Data',
      exam_tip_summary: 'Kinesis Streams vs Firehose and FSx for Lustre are the two highest-yield topics. Match the traffic profile and storage bottleneck to the right service.',
      sort_order: 1,
      content: readMd('TS1.1.md'),
    },
    {
      id: '00000000-0000-0000-0002-000000000002',
      domain_id: '00000000-0000-0000-0001-000000000001',
      code: 'TS1.2',
      title: 'Transform Data and Perform Feature Engineering',
      exam_tip_summary: 'The most tested concept is the service identity matrix — DataBrew vs Data Wrangler and Glue vs EMR are the two most common comparison questions.',
      sort_order: 2,
      content: readMd('TS1.2.md'),
    },
    {
      id: '00000000-0000-0000-0002-000000000003',
      domain_id: '00000000-0000-0000-0001-000000000001',
      code: 'TS1.3',
      title: 'Ensure Data Integrity and Prepare Data for Modeling',
      exam_tip_summary: 'SageMaker Clarify is tested in TWO places — pre-training bias detection here AND post-training SHAP explainability in Domain 2. Know both use cases.',
      sort_order: 3,
      content: readMd('TS1.3.md'),
    },
    // Domain 2
    {
      id: '00000000-0000-0000-0002-000000000004',
      domain_id: '00000000-0000-0000-0001-000000000002',
      code: 'TS2.1',
      title: 'Choose a Modeling Approach',
      exam_tip_summary: 'Know which AWS AI service matches which business problem, and which SageMaker built-in algorithm fits which ML task. Textract vs Rekognition is a common trap.',
      sort_order: 1,
      content: readMd('TS2.1.md'),
    },
    {
      id: '00000000-0000-0000-0002-000000000005',
      domain_id: '00000000-0000-0000-0001-000000000002',
      code: 'TS2.2',
      title: 'Train and Refine Models',
      exam_tip_summary: 'Spot Training + checkpointing and data parallelism vs model parallelism are very frequently tested. Pair every cost question with the right training mode.',
      sort_order: 2,
      content: readMd('TS2.2.md'),
    },
    {
      id: '00000000-0000-0000-0002-000000000006',
      domain_id: '00000000-0000-0000-0001-000000000002',
      code: 'TS2.3',
      title: 'Analyze Model Performance',
      exam_tip_summary: 'F1 vs AUC-ROC and when to use Precision vs Recall are very commonly tested. Never use accuracy on imbalanced datasets.',
      sort_order: 3,
      content: readMd('TS2.3.md'),
    },
    // Domain 3
    {
      id: '00000000-0000-0000-0002-000000000007',
      domain_id: '00000000-0000-0000-0001-000000000003',
      code: 'TS3.1',
      title: 'Select Deployment Infrastructure Based on Existing Architecture and Requirements',
      exam_tip_summary: 'Endpoint type selection is the most common deployment question. Match the traffic profile: Serverless=spiky, Async=large payload, Batch=offline, Real-time=consistent.',
      sort_order: 1,
      content: readMd('TS3.1.md'),
    },
    {
      id: '00000000-0000-0000-0002-000000000008',
      domain_id: '00000000-0000-0000-0001-000000000003',
      code: 'TS3.2',
      title: 'Create and Script Infrastructure Based on Existing Architecture and Requirements',
      exam_tip_summary: 'IaC tradeoffs (CloudFormation vs CDK) and auto scaling metric selection are commonly tested. CloudFormation=declarative, CDK=programmatic.',
      sort_order: 2,
      content: readMd('TS3.2.md'),
    },
    {
      id: '00000000-0000-0000-0002-000000000009',
      domain_id: '00000000-0000-0000-0001-000000000003',
      code: 'TS3.3',
      title: 'Use Automated Orchestration Tools to Set Up CI/CD Pipelines',
      exam_tip_summary: 'The standard MLOps pattern: SageMaker Pipelines + Model Registry + CodePipeline + CloudFormation is heavily tested. Know every service role and the order they fire.',
      sort_order: 3,
      content: readMd('TS3.3.md'),
    },
    // Domain 4
    {
      id: '00000000-0000-0000-0002-000000000010',
      domain_id: '00000000-0000-0000-0001-000000000004',
      code: 'TS4.1',
      title: 'Monitor Model Inference',
      exam_tip_summary: 'Know all four Model Monitor types and their ground truth dependency. BASELINE is always required first — missing baseline is the most common exam trap.',
      sort_order: 1,
      content: readMd('TS4.1.md'),
    },
    {
      id: '00000000-0000-0000-0002-000000000011',
      domain_id: '00000000-0000-0000-0001-000000000004',
      code: 'TS4.2',
      title: 'Monitor and Optimize Infrastructure and Costs',
      exam_tip_summary: 'Inferentia vs Trainium distinction is a common trap. Inferentia=inference cost savings. Trainium=training cost savings. Always anchor to the ML phase.',
      sort_order: 2,
      content: readMd('TS4.2.md'),
    },
    {
      id: '00000000-0000-0000-0002-000000000012',
      domain_id: '00000000-0000-0000-0001-000000000004',
      code: 'TS4.3',
      title: 'Secure AWS Resources',
      exam_tip_summary: 'The five-layer security pattern: VPC private subnets + VPC Endpoints + KMS + IAM least privilege + CloudTrail is the most tested security architecture.',
      sort_order: 3,
      content: readMd('TS4.3.md'),
    },
  ]

  for (const lo of los) {
    await upsert('los', lo, 'code')
    console.log(`   ✓ ${lo.code}: ${lo.title} (${lo.content.length} chars)`)
  }

  // ── 4. SUBTOPICS (tags only — no content) ─────────────────────────────
  console.log('\n4. Seeding subtopics...')
  const subtopics = [
    // TS1.1
    { id: '00000000-0000-0000-0003-000000000001', lo_id: '00000000-0000-0000-0002-000000000001', code: 'k-1-1-1', title: 'Streaming vs Batch Ingestion', subtopic_type: 'knowledge', sort_order: 1 },
    { id: '00000000-0000-0000-0003-000000000002', lo_id: '00000000-0000-0000-0002-000000000001', code: 'k-1-1-2', title: 'Kinesis Data Firehose', subtopic_type: 'knowledge', sort_order: 2 },
    { id: '00000000-0000-0000-0003-000000000003', lo_id: '00000000-0000-0000-0002-000000000001', code: 'k-1-1-3', title: 'Kinesis Data Streams', subtopic_type: 'knowledge', sort_order: 3 },
    { id: '00000000-0000-0000-0003-000000000004', lo_id: '00000000-0000-0000-0002-000000000001', code: 'k-1-1-4', title: 'Amazon MSK', subtopic_type: 'knowledge', sort_order: 4 },
    { id: '00000000-0000-0000-0003-000000000005', lo_id: '00000000-0000-0000-0002-000000000001', code: 'k-1-1-5', title: 'Amazon S3 as ML Data Lake', subtopic_type: 'knowledge', sort_order: 5 },
    { id: '00000000-0000-0000-0003-000000000006', lo_id: '00000000-0000-0000-0002-000000000001', code: 'k-1-1-6', title: 'Amazon FSx for Lustre', subtopic_type: 'knowledge', sort_order: 6 },
    { id: '00000000-0000-0000-0003-000000000007', lo_id: '00000000-0000-0000-0002-000000000001', code: 'k-1-1-7', title: 'Amazon EFS', subtopic_type: 'knowledge', sort_order: 7 },
    { id: '00000000-0000-0000-0003-000000000008', lo_id: '00000000-0000-0000-0002-000000000001', code: 'k-1-1-8', title: 'Data Governance — Lake Formation and Glue Catalog', subtopic_type: 'knowledge', sort_order: 8 },
    { id: '00000000-0000-0000-0003-000000000009', lo_id: '00000000-0000-0000-0002-000000000001', code: 's-1-1-1', title: 'Data Format Selection', subtopic_type: 'skill', sort_order: 9 },
    { id: '00000000-0000-0000-0003-000000000010', lo_id: '00000000-0000-0000-0002-000000000001', code: 's-1-1-2', title: 'Storage Decision Framework', subtopic_type: 'skill', sort_order: 10 },
    // TS1.2
    { id: '00000000-0000-0000-0003-000000000011', lo_id: '00000000-0000-0000-0002-000000000002', code: 'k-1-2-1', title: 'AWS Glue', subtopic_type: 'knowledge', sort_order: 1 },
    { id: '00000000-0000-0000-0003-000000000012', lo_id: '00000000-0000-0000-0002-000000000002', code: 'k-1-2-2', title: 'Amazon EMR', subtopic_type: 'knowledge', sort_order: 2 },
    { id: '00000000-0000-0000-0003-000000000013', lo_id: '00000000-0000-0000-0002-000000000002', code: 'k-1-2-3', title: 'AWS Glue DataBrew', subtopic_type: 'knowledge', sort_order: 3 },
    { id: '00000000-0000-0000-0003-000000000014', lo_id: '00000000-0000-0000-0002-000000000002', code: 'k-1-2-4', title: 'SageMaker Data Wrangler', subtopic_type: 'knowledge', sort_order: 4 },
    { id: '00000000-0000-0000-0003-000000000015', lo_id: '00000000-0000-0000-0002-000000000002', code: 'k-1-2-5', title: 'Amazon Athena', subtopic_type: 'knowledge', sort_order: 5 },
    { id: '00000000-0000-0000-0003-000000000016', lo_id: '00000000-0000-0000-0002-000000000002', code: 'k-1-2-6', title: 'Feature Engineering Techniques', subtopic_type: 'knowledge', sort_order: 6 },
    { id: '00000000-0000-0000-0003-000000000017', lo_id: '00000000-0000-0000-0002-000000000002', code: 'k-1-2-7', title: 'SageMaker Feature Store', subtopic_type: 'knowledge', sort_order: 7 },
    { id: '00000000-0000-0000-0003-000000000018', lo_id: '00000000-0000-0000-0002-000000000002', code: 's-1-2-1', title: 'Service Selection Framework', subtopic_type: 'skill', sort_order: 8 },
    { id: '00000000-0000-0000-0003-000000000019', lo_id: '00000000-0000-0000-0002-000000000002', code: 's-1-2-2', title: 'Cross-LO Pipeline Connections', subtopic_type: 'skill', sort_order: 9 },
    // TS1.3
    { id: '00000000-0000-0000-0003-000000000020', lo_id: '00000000-0000-0000-0002-000000000003', code: 'k-1-3-1', title: 'SageMaker Ground Truth', subtopic_type: 'knowledge', sort_order: 1 },
    { id: '00000000-0000-0000-0003-000000000021', lo_id: '00000000-0000-0000-0002-000000000003', code: 'k-1-3-2', title: 'SageMaker Clarify Pre-training', subtopic_type: 'knowledge', sort_order: 2 },
    { id: '00000000-0000-0000-0003-000000000022', lo_id: '00000000-0000-0000-0002-000000000003', code: 'k-1-3-3', title: 'Class Imbalance Strategies', subtopic_type: 'knowledge', sort_order: 3 },
    { id: '00000000-0000-0000-0003-000000000023', lo_id: '00000000-0000-0000-0002-000000000003', code: 'k-1-3-4', title: 'AWS Glue Data Quality', subtopic_type: 'knowledge', sort_order: 4 },
    { id: '00000000-0000-0000-0003-000000000024', lo_id: '00000000-0000-0000-0002-000000000003', code: 'k-1-3-5', title: 'Data Compliance — PII PHI Data Residency', subtopic_type: 'knowledge', sort_order: 5 },
    { id: '00000000-0000-0000-0003-000000000025', lo_id: '00000000-0000-0000-0002-000000000003', code: 's-1-3-1', title: 'Data Integrity If-Then Framework', subtopic_type: 'skill', sort_order: 6 },
    { id: '00000000-0000-0000-0003-000000000026', lo_id: '00000000-0000-0000-0002-000000000003', code: 's-1-3-2', title: 'Data Splitting and Augmentation', subtopic_type: 'skill', sort_order: 7 },
    // TS2.1
    { id: '00000000-0000-0000-0003-000000000027', lo_id: '00000000-0000-0000-0002-000000000004', code: 'k-2-1-1', title: 'SageMaker Built-in Algorithms', subtopic_type: 'knowledge', sort_order: 1 },
    { id: '00000000-0000-0000-0003-000000000028', lo_id: '00000000-0000-0000-0002-000000000004', code: 'k-2-1-2', title: 'AWS AI Services', subtopic_type: 'knowledge', sort_order: 2 },
    { id: '00000000-0000-0000-0003-000000000029', lo_id: '00000000-0000-0000-0002-000000000004', code: 'k-2-1-3', title: 'Foundation Models and Generative AI', subtopic_type: 'knowledge', sort_order: 3 },
    { id: '00000000-0000-0000-0003-000000000030', lo_id: '00000000-0000-0000-0002-000000000004', code: 's-2-1-1', title: 'Algorithm and Service Selection', subtopic_type: 'skill', sort_order: 4 },
    // TS2.2
    { id: '00000000-0000-0000-0003-000000000031', lo_id: '00000000-0000-0000-0002-000000000005', code: 'k-2-2-1', title: 'Managed Spot Training', subtopic_type: 'knowledge', sort_order: 1 },
    { id: '00000000-0000-0000-0003-000000000032', lo_id: '00000000-0000-0000-0002-000000000005', code: 'k-2-2-2', title: 'SageMaker Automatic Model Tuning', subtopic_type: 'knowledge', sort_order: 2 },
    { id: '00000000-0000-0000-0003-000000000033', lo_id: '00000000-0000-0000-0002-000000000005', code: 'k-2-2-3', title: 'Distributed Training', subtopic_type: 'knowledge', sort_order: 3 },
    { id: '00000000-0000-0000-0003-000000000034', lo_id: '00000000-0000-0000-0002-000000000005', code: 'k-2-2-4', title: 'Regularization Techniques', subtopic_type: 'knowledge', sort_order: 4 },
    { id: '00000000-0000-0000-0003-000000000035', lo_id: '00000000-0000-0000-0002-000000000005', code: 'k-2-2-5', title: 'Model Improvement Techniques', subtopic_type: 'knowledge', sort_order: 5 },
    { id: '00000000-0000-0000-0003-000000000036', lo_id: '00000000-0000-0000-0002-000000000005', code: 's-2-2-1', title: 'Training Configuration Decisions', subtopic_type: 'skill', sort_order: 6 },
    // TS2.3
    { id: '00000000-0000-0000-0003-000000000037', lo_id: '00000000-0000-0000-0002-000000000006', code: 'k-2-3-1', title: 'Regression Metrics', subtopic_type: 'knowledge', sort_order: 1 },
    { id: '00000000-0000-0000-0003-000000000038', lo_id: '00000000-0000-0000-0002-000000000006', code: 'k-2-3-2', title: 'Classification Metrics', subtopic_type: 'knowledge', sort_order: 2 },
    { id: '00000000-0000-0000-0003-000000000039', lo_id: '00000000-0000-0000-0002-000000000006', code: 'k-2-3-3', title: 'Overfitting and Underfitting', subtopic_type: 'knowledge', sort_order: 3 },
    { id: '00000000-0000-0000-0003-000000000040', lo_id: '00000000-0000-0000-0002-000000000006', code: 'k-2-3-4', title: 'SageMaker Debugger and Clarify Post-training', subtopic_type: 'knowledge', sort_order: 4 },
    { id: '00000000-0000-0000-0003-000000000041', lo_id: '00000000-0000-0000-0002-000000000006', code: 's-2-3-1', title: 'Shadow Testing vs AB Testing', subtopic_type: 'skill', sort_order: 5 },
    // TS3.1
    { id: '00000000-0000-0000-0003-000000000042', lo_id: '00000000-0000-0000-0002-000000000007', code: 'k-3-1-1', title: 'SageMaker Endpoint Types', subtopic_type: 'knowledge', sort_order: 1 },
    { id: '00000000-0000-0000-0003-000000000043', lo_id: '00000000-0000-0000-0002-000000000007', code: 'k-3-1-2', title: 'Advanced Endpoint Configurations', subtopic_type: 'knowledge', sort_order: 2 },
    { id: '00000000-0000-0000-0003-000000000044', lo_id: '00000000-0000-0000-0002-000000000007', code: 'k-3-1-3', title: 'Deployment Strategies', subtopic_type: 'knowledge', sort_order: 3 },
    { id: '00000000-0000-0000-0003-000000000045', lo_id: '00000000-0000-0000-0002-000000000007', code: 'k-3-1-4', title: 'SageMaker Neo and Edge Deployment', subtopic_type: 'knowledge', sort_order: 4 },
    { id: '00000000-0000-0000-0003-000000000046', lo_id: '00000000-0000-0000-0002-000000000007', code: 's-3-1-1', title: 'Deployment Infrastructure Selection', subtopic_type: 'skill', sort_order: 5 },
    // TS3.2
    { id: '00000000-0000-0000-0003-000000000047', lo_id: '00000000-0000-0000-0002-000000000008', code: 'k-3-2-1', title: 'Infrastructure as Code', subtopic_type: 'knowledge', sort_order: 1 },
    { id: '00000000-0000-0000-0003-000000000048', lo_id: '00000000-0000-0000-0002-000000000008', code: 'k-3-2-2', title: 'SageMaker Endpoint Auto Scaling', subtopic_type: 'knowledge', sort_order: 2 },
    { id: '00000000-0000-0000-0003-000000000049', lo_id: '00000000-0000-0000-0002-000000000008', code: 'k-3-2-3', title: 'Container and Network Infrastructure', subtopic_type: 'knowledge', sort_order: 3 },
    { id: '00000000-0000-0000-0003-000000000050', lo_id: '00000000-0000-0000-0002-000000000008', code: 's-3-2-1', title: 'IaC and Scaling Decisions', subtopic_type: 'skill', sort_order: 4 },
    // TS3.3
    { id: '00000000-0000-0000-0003-000000000051', lo_id: '00000000-0000-0000-0002-000000000009', code: 'k-3-3-1', title: 'SageMaker Pipelines', subtopic_type: 'knowledge', sort_order: 1 },
    { id: '00000000-0000-0000-0003-000000000052', lo_id: '00000000-0000-0000-0002-000000000009', code: 'k-3-3-2', title: 'SageMaker Model Registry', subtopic_type: 'knowledge', sort_order: 2 },
    { id: '00000000-0000-0000-0003-000000000053', lo_id: '00000000-0000-0000-0002-000000000009', code: 'k-3-3-3', title: 'CI/CD with CodePipeline and CodeBuild', subtopic_type: 'knowledge', sort_order: 3 },
    { id: '00000000-0000-0000-0003-000000000054', lo_id: '00000000-0000-0000-0002-000000000009', code: 'k-3-3-4', title: 'Step Functions and MWAA', subtopic_type: 'knowledge', sort_order: 4 },
    { id: '00000000-0000-0000-0003-000000000055', lo_id: '00000000-0000-0000-0002-000000000009', code: 's-3-3-1', title: 'MLOps Architecture Pattern', subtopic_type: 'skill', sort_order: 5 },
    { id: '00000000-0000-0000-0003-000000000056', lo_id: '00000000-0000-0000-0002-000000000009', code: 's-3-3-2', title: 'Event-Driven Retraining', subtopic_type: 'skill', sort_order: 6 },
    // TS4.1
    { id: '00000000-0000-0000-0003-000000000057', lo_id: '00000000-0000-0000-0002-000000000010', code: 'k-4-1-1', title: 'Model Drift Types', subtopic_type: 'knowledge', sort_order: 1 },
    { id: '00000000-0000-0000-0003-000000000058', lo_id: '00000000-0000-0000-0002-000000000010', code: 'k-4-1-2', title: 'SageMaker Model Monitor', subtopic_type: 'knowledge', sort_order: 2 },
    { id: '00000000-0000-0000-0003-000000000059', lo_id: '00000000-0000-0000-0002-000000000010', code: 'k-4-1-3', title: 'Baseline Requirement', subtopic_type: 'knowledge', sort_order: 3 },
    { id: '00000000-0000-0000-0003-000000000060', lo_id: '00000000-0000-0000-0002-000000000010', code: 'k-4-1-4', title: 'System Monitoring Tools', subtopic_type: 'knowledge', sort_order: 4 },
    { id: '00000000-0000-0000-0003-000000000061', lo_id: '00000000-0000-0000-0002-000000000010', code: 's-4-1-1', title: 'Monitor Type Selection', subtopic_type: 'skill', sort_order: 5 },
    // TS4.2
    { id: '00000000-0000-0000-0003-000000000062', lo_id: '00000000-0000-0000-0002-000000000011', code: 'k-4-2-1', title: 'Compute Purchasing Options', subtopic_type: 'knowledge', sort_order: 1 },
    { id: '00000000-0000-0000-0003-000000000063', lo_id: '00000000-0000-0000-0002-000000000011', code: 'k-4-2-2', title: 'Inferentia vs Trainium', subtopic_type: 'knowledge', sort_order: 2 },
    { id: '00000000-0000-0000-0003-000000000064', lo_id: '00000000-0000-0000-0002-000000000011', code: 'k-4-2-3', title: 'Cost Analysis and Right-Sizing Tools', subtopic_type: 'knowledge', sort_order: 3 },
    { id: '00000000-0000-0000-0003-000000000065', lo_id: '00000000-0000-0000-0002-000000000011', code: 's-4-2-1', title: 'Cost Optimization Decisions', subtopic_type: 'skill', sort_order: 4 },
    // TS4.3
    { id: '00000000-0000-0000-0003-000000000066', lo_id: '00000000-0000-0000-0002-000000000012', code: 'k-4-3-1', title: 'IAM Access Control', subtopic_type: 'knowledge', sort_order: 1 },
    { id: '00000000-0000-0000-0003-000000000067', lo_id: '00000000-0000-0000-0002-000000000012', code: 'k-4-3-2', title: 'Network Security Architecture', subtopic_type: 'knowledge', sort_order: 2 },
    { id: '00000000-0000-0000-0003-000000000068', lo_id: '00000000-0000-0000-0002-000000000012', code: 'k-4-3-3', title: 'Data Protection and Encryption', subtopic_type: 'knowledge', sort_order: 3 },
    { id: '00000000-0000-0000-0003-000000000069', lo_id: '00000000-0000-0000-0002-000000000012', code: 'k-4-3-4', title: 'Audit Compliance and Responsible AI', subtopic_type: 'knowledge', sort_order: 4 },
    { id: '00000000-0000-0000-0003-000000000070', lo_id: '00000000-0000-0000-0002-000000000012', code: 's-4-3-1', title: 'Five-Layer Security Architecture', subtopic_type: 'skill', sort_order: 5 },
  ]

  for (const s of subtopics) {
    await upsert('subtopics', s, 'code')
  }
  console.log(`   ✓ ${subtopics.length} subtopics seeded`)

  // ── 5. LO_QUESTION_TYPES ───────────────────────────────────────────────
  console.log('\n5. Seeding lo_question_types...')

  // First get question_type IDs from DB
  const { data: qtypes } = await supabase.from('question_types').select('id, code')
  const qt = Object.fromEntries(qtypes.map(q => [q.code, q.id]))

  const loQTypes = [
    // TS1.1 — mc, mr, matching
    { lo_id: '00000000-0000-0000-0002-000000000001', question_type_id: qt['mc'] },
    { lo_id: '00000000-0000-0000-0002-000000000001', question_type_id: qt['mr'] },
    { lo_id: '00000000-0000-0000-0002-000000000001', question_type_id: qt['matching'] },
    // TS1.2 — mc, mr, matching
    { lo_id: '00000000-0000-0000-0002-000000000002', question_type_id: qt['mc'] },
    { lo_id: '00000000-0000-0000-0002-000000000002', question_type_id: qt['mr'] },
    { lo_id: '00000000-0000-0000-0002-000000000002', question_type_id: qt['matching'] },
    // TS1.3 — mc, mr
    { lo_id: '00000000-0000-0000-0002-000000000003', question_type_id: qt['mc'] },
    { lo_id: '00000000-0000-0000-0002-000000000003', question_type_id: qt['mr'] },
    // TS2.1 — mc, mr, matching
    { lo_id: '00000000-0000-0000-0002-000000000004', question_type_id: qt['mc'] },
    { lo_id: '00000000-0000-0000-0002-000000000004', question_type_id: qt['mr'] },
    { lo_id: '00000000-0000-0000-0002-000000000004', question_type_id: qt['matching'] },
    // TS2.2 — mc, mr, ordering
    { lo_id: '00000000-0000-0000-0002-000000000005', question_type_id: qt['mc'] },
    { lo_id: '00000000-0000-0000-0002-000000000005', question_type_id: qt['mr'] },
    { lo_id: '00000000-0000-0000-0002-000000000005', question_type_id: qt['ordering'] },
    // TS2.3 — mc, mr, matching
    { lo_id: '00000000-0000-0000-0002-000000000006', question_type_id: qt['mc'] },
    { lo_id: '00000000-0000-0000-0002-000000000006', question_type_id: qt['mr'] },
    { lo_id: '00000000-0000-0000-0002-000000000006', question_type_id: qt['matching'] },
    // TS3.1 — mc, mr, matching, ordering
    { lo_id: '00000000-0000-0000-0002-000000000007', question_type_id: qt['mc'] },
    { lo_id: '00000000-0000-0000-0002-000000000007', question_type_id: qt['mr'] },
    { lo_id: '00000000-0000-0000-0002-000000000007', question_type_id: qt['matching'] },
    { lo_id: '00000000-0000-0000-0002-000000000007', question_type_id: qt['ordering'] },
    // TS3.2 — mc, mr
    { lo_id: '00000000-0000-0000-0002-000000000008', question_type_id: qt['mc'] },
    { lo_id: '00000000-0000-0000-0002-000000000008', question_type_id: qt['mr'] },
    // TS3.3 — mc, mr, ordering, case
    { lo_id: '00000000-0000-0000-0002-000000000009', question_type_id: qt['mc'] },
    { lo_id: '00000000-0000-0000-0002-000000000009', question_type_id: qt['mr'] },
    { lo_id: '00000000-0000-0000-0002-000000000009', question_type_id: qt['ordering'] },
    { lo_id: '00000000-0000-0000-0002-000000000009', question_type_id: qt['case'] },
    // TS4.1 — mc, mr, matching
    { lo_id: '00000000-0000-0000-0002-000000000010', question_type_id: qt['mc'] },
    { lo_id: '00000000-0000-0000-0002-000000000010', question_type_id: qt['mr'] },
    { lo_id: '00000000-0000-0000-0002-000000000010', question_type_id: qt['matching'] },
    // TS4.2 — mc, mr, matching
    { lo_id: '00000000-0000-0000-0002-000000000011', question_type_id: qt['mc'] },
    { lo_id: '00000000-0000-0000-0002-000000000011', question_type_id: qt['mr'] },
    { lo_id: '00000000-0000-0000-0002-000000000011', question_type_id: qt['matching'] },
    // TS4.3 — mc, mr, ordering, case
    { lo_id: '00000000-0000-0000-0002-000000000012', question_type_id: qt['mc'] },
    { lo_id: '00000000-0000-0000-0002-000000000012', question_type_id: qt['mr'] },
    { lo_id: '00000000-0000-0000-0002-000000000012', question_type_id: qt['ordering'] },
    { lo_id: '00000000-0000-0000-0002-000000000012', question_type_id: qt['case'] },
  ]

  await upsertJunction('lo_question_types', loQTypes, 'lo_id,question_type_id')
  console.log(`   ✓ ${loQTypes.length} lo_question_type rows seeded`)

  // ── DONE ───────────────────────────────────────────────────────────────
  console.log('\n=== SEED COMPLETE ===')
  console.log('Summary:')
  console.log('  1 exam (MLA-C01, status=published)')
  console.log('  4 domains')
  console.log('  12 LOs with real Markdown content')
  console.log(`  ${subtopics.length} subtopics (tags only)`)
  console.log(`  ${loQTypes.length} lo_question_type entries`)
  console.log('\nNext step: run seed_questions.js to add the question bank.')
}

seed().catch(err => {
  console.error('\nSEED FAILED:', err.message)
  process.exit(1)
})
