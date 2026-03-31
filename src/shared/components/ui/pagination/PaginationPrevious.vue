<script setup lang="ts">
import type { PaginationPrevProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import type { ButtonVariants } from '@/shared/components/ui/button'
import { reactiveOmit } from "@vueuse/core"
import { ChevronLeftIcon } from "lucide-vue-next"
import { PaginationPrev, useForwardProps } from "reka-ui"
import { cn } from '@/shared/lib/utils'
import { buttonVariants } from '@/shared/components/ui/button'

const props = withDefaults(defineProps<PaginationPrevProps & {
  size?: ButtonVariants["size"]
  class?: HTMLAttributes["class"]
}>(), {
  size: "default",
})

const delegatedProps = reactiveOmit(props, "class", "size")
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <PaginationPrev
    data-slot="pagination-previous"
    :class="cn('pagination-previous gap-1 px-2.5', buttonVariants({ variant: 'ghost', size }), props.class)"
    v-bind="forwarded"
  >
    <slot>
      <ChevronLeftIcon />
      <span class="pagination-previous__label hidden">Previous</span>
    </slot>
  </PaginationPrev>
</template>

<style scoped lang="scss">
.pagination-previous {
  @media (min-width: 640px) {
    padding-right: 0.625rem;
  }
}

.pagination-previous__label {
  @media (min-width: 640px) {
    display: block;
  }
}
</style>
