<script setup>
import { useAssignmentStore } from '../../composables/useAssignmentStore'

const { users, currentUser, switchUser, canAssign } = useAssignmentStore()
</script>

<template>
  <section class="role-box" :class="{ 'role-box--locked': !canAssign }">
    <div class="role-info">
      <span class="role-label">当前身份</span>
      <strong>{{ currentUser.name }} · {{ currentUser.roleLabel }}</strong>
      <p class="role-hint">
        <template v-if="canAssign">
          可对待分配任务进行落单、裁定双认领或撤销最近一次分配。
        </template>
        <template v-else>
          只读模式：仅可查看系统给出的分配建议，不能改动任何归属。
        </template>
      </p>
    </div>
    <div class="role-switch" role="group" aria-label="切换演示身份">
      <button
        v-for="user in users"
        :key="user.id"
        type="button"
        class="role-btn"
        :class="{ 'role-btn--active': user.id === currentUser.id }"
        @click="switchUser(user.id)"
      >
        {{ user.name }}
        <small>{{ user.roleLabel }}</small>
      </button>
    </div>
  </section>
</template>

<style scoped>
.role-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
  padding: 16px 20px;
  border-radius: 18px;
  border: 1px solid rgba(79, 57, 32, 0.14);
  background: rgba(255, 251, 245, 0.9);
}

.role-box--locked {
  background: rgba(239, 232, 220, 0.9);
}

.role-info {
  display: grid;
  gap: 4px;
}

.role-label {
  font-size: 0.74rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #82684b;
}

.role-hint {
  margin: 0;
  font-size: 0.84rem;
  color: #6f5d44;
}

.role-switch {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.role-btn {
  display: grid;
  gap: 2px;
  padding: 9px 14px;
  border-radius: 12px;
  border: 1px solid rgba(79, 57, 32, 0.18);
  background: rgba(255, 255, 255, 0.8);
  color: #5d4322;
  font-family: inherit;
  cursor: pointer;
}

.role-btn small {
  font-size: 0.7rem;
  color: #8a7456;
}

.role-btn--active {
  background: #5d4322;
  color: #fff8eb;
  border-color: #5d4322;
}

.role-btn--active small {
  color: rgba(255, 248, 235, 0.75);
}
</style>
