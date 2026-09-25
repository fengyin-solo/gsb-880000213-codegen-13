<script setup>
import { RouterView } from 'vue-router'
import AppHeader from './components/common/AppHeader.vue'
import AppSidebar from './components/common/AppSidebar.vue'
import { restorationNavigation } from './data/restorationData'
</script>

<template>
  <div class="app-shell">
    <AppSidebar
      title="Conservation Desk"
      subtitle="古籍虫蛀修复"
      :items="restorationNavigation"
    />
    <div class="app-main">
      <AppHeader
        eyebrow="Studio Console"
        title="文献修复流程工作台"
        description="集中看待分配任务、修复师在办量与可用时段；具备分配权限的协调员可落单、裁定双认领并回退，查看者只读建议。"
      />
      <RouterView />
    </div>
  </div>
</template>
