<script setup>
import PanelSection from '../components/common/PanelSection.vue'
import StatCard from '../components/common/StatCard.vue'
import BatchGrid from '../components/restoration/BatchGrid.vue'
import EnvironmentCards from '../components/restoration/EnvironmentCards.vue'
import HeroBanner from '../components/restoration/HeroBanner.vue'
import {
  restorationBatches,
  restorationEnvironment,
  restorationHero,
  restorationSteps,
} from '../data/restorationData'
import { useRestorationOverview } from '../composables/useRestorationOverview'
import { useAssignmentStore } from '../composables/useAssignmentStore'

const {
  batchCount,
  highRiskCount,
  ownerCount,
  environmentCount,
  pendingCount,
} = useRestorationOverview()

const { ownerLoads, archivedTasks } = useAssignmentStore()

const statCards = [
  { label: '在册批次', value: batchCount.value },
  { label: '待分配任务', value: pendingCount.value },
  { label: '高风险任务', value: highRiskCount.value },
  { label: '在办修复师', value: ownerCount.value },
]
</script>

<template>
  <div class="view-stack">
    <HeroBanner :hero="restorationHero" />

    <section class="stats-grid">
      <StatCard
        v-for="card in statCards"
        :key="card.label"
        :label="card.label"
        :value="card.value"
      />
    </section>

    <PanelSection title="负责人负载" badge="与任务清单同源">
      <div class="owner-load">
        <div v-for="entry in ownerLoads" :key="entry.restorer.id" class="owner-row">
          <div class="owner-meta">
            <span class="owner-name">{{ entry.restorer.name }}</span>
            <span v-if="!entry.restorer.active" class="owner-tag owner-tag--off">已停用</span>
          </div>
          <div class="owner-bar">
            <span
              class="owner-bar-fill"
              :style="{ width: `${Math.min(entry.activeCount * 25, 100)}%` }"
            />
          </div>
          <strong class="owner-count">{{ entry.activeCount }} 件在办</strong>
        </div>
        <p class="owner-note">
          已停用修复师不参与新任务分配；历史归档 {{ archivedTasks.length }} 件仍显示原负责人。
        </p>
      </div>
    </PanelSection>

    <section class="two-column">
      <PanelSection title="重点批次" badge="优先处理">
        <BatchGrid :items="restorationBatches" />
      </PanelSection>

      <PanelSection title="当日工序" badge="修复流程">
        <ol class="step-list">
          <li v-for="step in restorationSteps" :key="step">{{ step }}</li>
        </ol>
      </PanelSection>
    </section>

    <PanelSection title="环境参数" badge="修复室 2">
      <EnvironmentCards :items="restorationEnvironment" />
    </PanelSection>
  </div>
</template>

<style scoped>
.view-stack {
  display: grid;
  gap: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.owner-load {
  display: grid;
  gap: 12px;
}

.owner-row {
  display: grid;
  grid-template-columns: 160px 1fr 90px;
  align-items: center;
  gap: 14px;
}

.owner-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.owner-name {
  font-weight: 700;
}

.owner-tag {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-style: normal;
}

.owner-tag--off {
  background: #e7e0d3;
  color: #6f6049;
}

.owner-bar {
  height: 10px;
  border-radius: 999px;
  background: rgba(79, 57, 32, 0.1);
  overflow: hidden;
}

.owner-bar-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #a97c45, #6f5028);
  transition: width 0.3s ease;
}

.owner-count {
  font-size: 0.9rem;
  text-align: right;
}

.owner-note {
  margin: 4px 0 0;
  font-size: 0.82rem;
  color: #82684b;
}

.two-column {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 24px;
}

.step-list {
  margin: 0;
  padding-left: 20px;
  color: #5c4a33;
}

.step-list li + li {
  margin-top: 12px;
}

@media (max-width: 980px) {
  .stats-grid,
  .two-column {
    grid-template-columns: 1fr;
  }

  .owner-row {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .owner-count {
    text-align: left;
  }
}
</style>
