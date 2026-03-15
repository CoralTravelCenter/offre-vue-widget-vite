<script setup lang="ts">
import type {TabsListProps} from "reka-ui"
import {TabsList} from "reka-ui"
import type {HTMLAttributes} from "vue"
import {reactiveOmit} from "@vueuse/core"
import {cn} from '@/shared/lib/utils'

const props = defineProps<TabsListProps & { class?: HTMLAttributes["class"] }>()

const delegatedProps = reactiveOmit(props, "class")
</script>

<template>
  <TabsList
      data-slot="tabs-list"
      v-bind="delegatedProps"
      :class="cn(

      props.class,
    )"
  >
    <slot/>
  </TabsList>
</template>
