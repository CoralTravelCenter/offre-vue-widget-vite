<script setup lang="ts">
import { Skeleton } from "ui/skeleton";
</script>

<template>
  <section
    aria-hidden="true"
    class="overflow-hidden rounded-[24px] bg-white"
  >
    <div class="relative min-h-[500px] overflow-hidden lg:h-[520px] lg:min-h-0">
      <div class="absolute inset-0 h-full bg-[linear-gradient(180deg,#eef6fb_0%,#f7fbfd_100%)]">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_20%_28%,rgba(22,119,255,0.12)_0_4px,transparent_5px),radial-gradient(circle_at_72%_34%,rgba(22,119,255,0.12)_0_4px,transparent_5px),radial-gradient(circle_at_58%_74%,rgba(22,119,255,0.12)_0_4px,transparent_5px),linear-gradient(0deg,rgba(255,255,255,0.86),rgba(255,255,255,0.86)),linear-gradient(135deg,#f2f4f7_25%,transparent_25%),linear-gradient(225deg,#f2f4f7_25%,transparent_25%),linear-gradient(315deg,#f2f4f7_25%,transparent_25%),linear-gradient(45deg,#f2f4f7_25%,#fbfcfd_25%)] [background-position:0_0,-16px_0,-16px_0,0_0,-16px_0,-16px_0,0_0,0_0] [background-size:auto,auto,auto,auto,32px_32px,32px_32px,32px_32px,32px_32px]" />

        <Skeleton class="absolute left-[38%] top-[28%] h-7 w-[72px] rounded-full bg-[#d7ecfb]" />
        <Skeleton class="absolute left-[62%] top-[46%] h-7 w-[72px] rounded-full bg-[#d7ecfb]" />
        <Skeleton class="absolute left-[48%] top-[66%] h-7 w-[72px] rounded-full bg-[#d7ecfb]" />
      </div>

      <div class="absolute bottom-4 left-4 top-4 z-[2] hidden w-[23%] max-w-[300px] overflow-hidden rounded-[14px] border border-[#f0f0f0] bg-[rgba(255,255,255,0.96)] shadow-[0_8px_22px_rgba(0,0,0,0.08)] lg:block">
        <div class="grid gap-[10px] px-3 pb-2 pt-3">
          <Skeleton class="h-[18px] w-32 bg-[#e5e7eb]" />
          <Skeleton class="h-8 w-full bg-[#e5e7eb]" />
        </div>

        <Skeleton class="mx-3 mb-[10px] h-9 bg-[#e5e7eb]" />

        <div class="grid gap-1.5 px-3 pb-3">
          <div
            v-for="index in 4"
            :key="index"
            class="grid grid-cols-[64px_minmax(0,1fr)] gap-2 rounded-[10px] border border-[#f0f0f0] bg-white p-1.5"
          >
            <Skeleton class="h-16 w-16 rounded-[8px] bg-[#e5e7eb]" />
            <div class="grid gap-1.5">
              <Skeleton class="h-4 w-[82%] bg-[#e5e7eb]" />
              <Skeleton class="h-[14px] w-[58%] bg-[#e5e7eb]" />
              <Skeleton class="h-[18px] w-[46%] bg-[#e5e7eb]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
