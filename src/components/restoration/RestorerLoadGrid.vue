<script setup>
import { slotLabelByIds } from '../../utils/restorationFormatters'
import { useAssignmentStore } from '../../composables/useAssignmentStore'

const { ownerLoads } = useAssignmentStore()
</script>

<template>
  <div class="restorer-grid">
    <article
      v-for="entry in ownerLoads"
      :key="entry.restorer.id"
      class="restorer-card"
      :class="{ 'restorer-card--off': !entry.restorer.active }"
    >
      <header class="restorer-head">
        <div>
          <strong class="restorer-name">{{ entry.restorer.name }}</strong>
          <span class="restorer-title">{{ entry.restorer.title }}</span>
        </div>
        <span
          class="restorer-state"
          :class="entry.restorer.active ? 'restorer-state--on' : 'restorer-state--off'"
        >
          {{ entry.restorer.active ? '在岗' : '已停用' }}
        </span>
      </header>
      <p class="restorer-slots">
        <span class="slots-label">可用时段</span>
        {{ slotLabelByIds(entry.restorer.slotIds) }}
      </p>
      <footer class="restorer-foot">
        <span>当前在办</span>
        <strong>{{ entry.activeCount }} 件</strong>
      </footer>
    </article>
  </div>
</template>

<style scoped>
.restorer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
}

.restorer-card {
  display: grid;
  gap: 12px;
  padding: 16px;
  border-radius: 16px;
  border: 1px solid rgba(79, 57, 32, 0.12);
  background: rgba(255, 255, 255, 0.72);
}

.restorer-card--off {
  opacity: 0.62;
  background: rgba(231, 224, 211, 0.6);
}

.restorer-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.restorer-name {
  display: block;
  font-size: 1.02rem;
}

.restorer-title {
  display: block;
  margin-top: 2px;
  font-size: 0.78rem;
  color: #8a7456;
}

.restorer-state {
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  white-space: nowrap;
}

.restorer-state--on {
  background: #d9ead9;
  color: #366338;
}

.restorer-state--off {
  background: #e7e0d3;
  color: #6f6049;
}

.restorer-slots {
  margin: 0;
  font-size: 0.84rem;
  color: #5c4a33;
  line-height: 1.7;
}

.slots-label {
  display: block;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #8a7456;
}

.restorer-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  border-top: 1px dashed rgba(79, 57, 32, 0.18);
  font-size: 0.86rem;
  color: #6f5d44;
}

.restorer-foot strong {
  font-size: 1.05rem;
  color: #4a3417;
}
</style>
