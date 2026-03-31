<script setup lang="ts">
import type { PaginationLastProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import type { ButtonVariants } from '@/shared/components/ui/button'
import { reactiveOmit } from "@vueuse/core"
import { ChevronRightIcon } from "lucide-vue-next"
import { PaginationLast, useForwardProps } from "reka-ui"
import { cn } from '@/shared/lib/utils'
import { buttonVariants } from '@/shared/components/ui/button'

const props = withDefaults(defineProps<PaginationLastProps & {
  size?: ButtonVariants["size"]
  class?: HTMLAttributes["class"]
}>(), {
  size: "default",
})

const delegatedProps = reactiveOmit(props, "class", "size")
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <PaginationLast
    data-slot="pagination-last"
    :class="cn('pagination-last gap-1 px-2.5', buttonVariants({ variant: 'ghost', size }), props.class)"
    v-bind="forwarded"
  >
    <slot>
      <span class="pagination-last__label hidden">Last</span>
      <ChevronRightIcon />
    </slot>
  </PaginationLast>
</template>

<style scoped lang="scss">
.pagination-last {
  @media (min-width: 640px) {
    padding-right: 0.625rem;
  }
}

.pagination-last__label {
  @media (min-width: 640px) {
    display: block;
  }
}
</style>
