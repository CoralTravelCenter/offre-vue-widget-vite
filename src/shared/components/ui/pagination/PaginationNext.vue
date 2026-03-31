<script setup lang="ts">
import type { PaginationNextProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import type { ButtonVariants } from '@/shared/components/ui/button'
import { reactiveOmit } from "@vueuse/core"
import { ChevronRightIcon } from "lucide-vue-next"
import { PaginationNext, useForwardProps } from "reka-ui"
import { cn } from '@/shared/lib/utils'
import { buttonVariants } from '@/shared/components/ui/button'

const props = withDefaults(defineProps<PaginationNextProps & {
  size?: ButtonVariants["size"]
  class?: HTMLAttributes["class"]
}>(), {
  size: "default",
})

const delegatedProps = reactiveOmit(props, "class", "size")
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <PaginationNext
    data-slot="pagination-next"
    :class="cn('pagination-next gap-1', buttonVariants({ variant: 'ghost', size }), props.class)"
    v-bind="forwarded"
  >
    <slot>
      <span class="pagination-next__label hidden">Next</span>
      <ChevronRightIcon />
    </slot>
  </PaginationNext>
</template>

<style scoped lang="scss">
.pagination-next__label {
  @media (min-width: 640px) {
    display: block;
  }
}
</style>
