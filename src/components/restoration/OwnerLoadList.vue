<script setup>
defineProps({
  loads: {
    type: Array,
    required: true,
  },
  slots: {
    type: Array,
    required: true,
  },
})

function slotLabel(slots, slotId) {
  return slots.find((item) => item.id === slotId)?.label ?? slotId
}
</script>

<template>
  <div class="load-list">
    <article
      v-for="load in loads"
      :key="load.id"
      :class="['load-card', { 'load-card--inactive': !load.active }]"
    >
      <header class="load-head">
        <div class="load-id">
          <strong>{{ load.name }}</strong>
          <span :class="['state-pill', load.active ? 'state-pill--on' : 'state-pill--off']">
            {{ load.active ? '在职' : '已停用' }}
          </span>
        </div>
        <span :class="['load-count', { 'load-count--full': load.overloaded }]">
          在办 {{ load.activeCount }}/{{ load.capacity }}
        </span>
      </header>

      <div class="load-meter" aria-hidden="true">
        <span
          class="load-meter-fill"
          :style="{ width: `${Math.min(100, (load.activeCount / load.capacity) * 100)}%` }"
        />
      </div>

      <div class="slot-line">
        <span class="slot-line-label">可用时段</span>
        <div class="slot-chips">
          <template v-for="slotId in load.availableSlots" :key="slotId">
            <span
              :class="[
                'slot-chip',
                { 'slot-chip--busy': load.occupiedSlotIds.includes(slotId) },
              ]"
            >
              {{ slotLabel(slots, slotId) }}
              <small v-if="load.occupiedSlotIds.includes(slotId)">占用</small>
            </span>
          </template>
        </div>
      </div>
    </article>
  </div>
</template>

<style scoped>
.load-list {
  display: grid;
  gap: 12px;
}

.load-card {
  padding: 16px;
  border-radius: 18px;
  background: #fbf5ea;
  border: 1px solid rgba(121, 88, 47, 0.14);
}

.load-card--inactive {
  opacity: 0.62;
  background: #f1ece2;
}

.load-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.load-id {
  display: flex;
  align-items: center;
  gap: 10px;
}

.state-pill {
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 0.72rem;
}

.state-pill--on {
  background: #d9ead9;
  color: #366338;
}

.state-pill--off {
  background: #e5d9d3;
  color: #7d4036;
}

.load-count {
  font-size: 0.84rem;
  color: #6a5439;
}

.load-count--full {
  color: #913d2f;
  font-weight: 700;
}

.load-meter {
  margin: 12px 0;
  height: 7px;
  border-radius: 999px;
  background: rgba(121, 88, 47, 0.12);
  overflow: hidden;
}

.load-meter-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #8a6a3f, #b2864f);
}

.slot-line-label {
  display: block;
  font-size: 0.74rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #82684b;
  margin-bottom: 8px;
}

.slot-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.slot-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 0.78rem;
  background: #eef3e7;
  color: #43603a;
  border: 1px solid rgba(67, 96, 58, 0.18);
}

.slot-chip--busy {
  background: #f3e3d0;
  color: #8a5d2a;
  border-color: rgba(138, 93, 42, 0.24);
}

.slot-chip small {
  font-size: 0.66rem;
  opacity: 0.75;
}
</style>
