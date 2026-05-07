<script setup lang="ts">
import type { TabsListProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { TabsList } from "reka-ui"
import { cn } from '@/shared/lib/utils'

const props = defineProps<TabsListProps & {
  class?: HTMLAttributes["class"]
  size?: "default" | "brand"
}>()

const delegatedProps = reactiveOmit(props, "class")
</script>

<template>
  <TabsList
    data-slot="tabs-list"
    :data-size="props.size ?? 'default'"
    v-bind="delegatedProps"
    :class="cn(
      'bg-transparent text-muted-foreground inline-flex w-fit items-center justify-center data-[size=default]:h-9 data-[size=default]:rounded-lg data-[size=default]:p-[3px] data-[size=brand]:h-auto data-[size=brand]:rounded-none data-[size=brand]:p-0',
      props.class,
    )"
  >
    <slot />
  </TabsList>
</template>
