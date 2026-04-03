<script setup lang="ts">
import {Skeleton} from "ui/skeleton";
</script>

<template>
  <article class="offre-offer-card-skeleton border border-border bg-white p-2" aria-hidden="true">
    <div class="offre-offer-card-skeleton__media">
      <Skeleton class="offre-offer-card-skeleton__image"/>

      <div class="offre-offer-card-skeleton__badges">
        <Skeleton class="offre-offer-card-skeleton__badge offre-offer-card-skeleton__badge--wide"/>
        <Skeleton class="offre-offer-card-skeleton__badge"/>
      </div>
    </div>

    <div class="offre-offer-card-skeleton__body">
      <Skeleton class="offre-offer-card-skeleton__location"/>
      <Skeleton class="offre-offer-card-skeleton__title offre-offer-card-skeleton__title--primary"/>
      <Skeleton class="offre-offer-card-skeleton__title offre-offer-card-skeleton__title--secondary"/>

      <div class="offre-offer-card-skeleton__stars">
        <Skeleton
          v-for="index in 5"
          :key="index"
          class="offre-offer-card-skeleton__star"
        />
      </div>

    <div class="offre-offer-card-skeleton__terms">
      <Skeleton
        v-for="index in 4"
        :key="`term-${index}`"
        class="offre-offer-card-skeleton__term"
      />
      </div>

      <div class="offre-offer-card-skeleton__usp-list">
        <Skeleton class="offre-offer-card-skeleton__usp offre-offer-card-skeleton__usp--wide"/>
        <Skeleton class="offre-offer-card-skeleton__usp"/>
        <Skeleton class="offre-offer-card-skeleton__usp offre-offer-card-skeleton__usp--narrow"/>
      </div>
    </div>

    <aside class="offre-offer-card-skeleton__aside">
      <div class="offre-offer-card-skeleton__tour-type">
        <Skeleton class="offre-offer-card-skeleton__tour-type-item"/>
        <Skeleton class="offre-offer-card-skeleton__tour-type-item"/>
      </div>

      <div class="offre-offer-card-skeleton__pricing">
        <Skeleton class="offre-offer-card-skeleton__old-price"/>
        <Skeleton class="offre-offer-card-skeleton__current-price"/>
        <Skeleton class="offre-offer-card-skeleton__price-note"/>
        <Skeleton class="offre-offer-card-skeleton__discount"/>
      </div>

      <Skeleton class="offre-offer-card-skeleton__cashback"/>
      <Skeleton class="offre-offer-card-skeleton__button"/>
    </aside>
  </article>
</template>

<style scoped lang="scss">
.offre-offer-card-skeleton {
  border-radius: var(--offre-radius-card);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;

  &__media {
    border-radius: var(--offre-radius-media);
    overflow: hidden;
    position: relative;
  }

  &__image {
    background-color: #e5e7eb;
    border-radius: inherit;
    display: block;
    height: 200px;
    width: 100%;
  }

  &__badges {
    display: flex;
    flex-direction: column;
    gap: 8px;
    left: 10px;
    position: absolute;
    top: 10px;
  }

  &__badge {
    background-color: #e5e7eb;
    border-radius: 999px;
    height: 28px;
    width: 92px;
  }

  &__badge--wide {
    width: 118px;
  }

  &__body {
    min-width: 0;
    padding: 8px 0;
  }

  &__location {
    background-color: #e5e7eb;
    height: 14px;
    margin-bottom: 8px;
    width: 52%;
  }

  &__title {
    background-color: #e5e7eb;
    height: 24px;
    width: 100%;
  }

  &__title + &__title {
    margin-top: 6px;
  }

  &__title--primary {
    width: 84%;
  }

  &__title--secondary {
    width: 62%;
  }

  &__stars {
    display: flex;
    gap: 6px;
    margin-top: 12px;
  }

  &__star {
    background-color: #e5e7eb;
    border-radius: 999px;
    height: 18px;
    width: 18px;
  }

  &__terms {
    display: grid;
    gap: 8px;
    margin-top: 14px;
  }

  &__term {
    background-color: #e5e7eb;
    height: 16px;
    width: 68%;
  }

  &__term:nth-child(1) {
    width: 54%;
  }

  &__term:nth-child(2) {
    width: 48%;
  }

  &__term:nth-child(3) {
    width: 36%;
  }

  &__term:nth-child(4) {
    width: 44%;
  }

  &__usp-list {
    border-top: 1px solid var(--border);
    display: grid;
    gap: 8px;
    margin-top: 12px;
    padding-top: 10px;
  }

  &__usp {
    background-color: #e5e7eb;
    height: 16px;
    width: 74%;
  }

  &__usp--wide {
    width: 88%;
  }

  &__usp--narrow {
    width: 58%;
  }

  &__aside {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: auto;
    padding-top: 6px;
    position: relative;
    width: 100%;
  }

  &__tour-type {
    display: grid;
    gap: 8px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    width: 100%;
  }

  &__tour-type-item {
    background-color: #e5e7eb;
    border-radius: var(--offre-radius-segment);
    height: 32px;
    width: 100%;
  }

  &__pricing {
    min-height: 84px;
    padding-right: 96px;
    position: relative;
    width: 100%;
  }

  &__old-price {
    background-color: #e5e7eb;
    height: 14px;
    width: 30%;
  }

  &__current-price {
    background-color: #e5e7eb;
    height: 38px;
    margin-top: 8px;
    width: 74%;
  }

  &__price-note {
    background-color: #e5e7eb;
    height: 12px;
    margin-top: 2px;
    width: 46%;
  }

  &__discount {
    background-color: #e5e7eb;
    border-radius: var(--offre-radius-badge);
    height: 28px;
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 88px;
  }

  &__cashback {
    background-color: #e5e7eb;
    border-radius: var(--offre-radius-badge);
    height: 50px;
    width: 100%;
  }

  &__button {
    background-color: #e5e7eb;
    border-radius: var(--offre-radius-button);
    height: 48px;
    width: 100%;
  }

  @media (min-width: 768px) and (max-width: 1023px) {
    &__badge {
      height: 26px;
    }

    &__body {
      padding: 10px 0 8px;
    }

    &__terms {
      gap: 6px;
      margin-top: 12px;
    }

    &__term:nth-child(1) {
      width: 58%;
    }

    &__term:nth-child(2) {
      width: 52%;
    }

    &__term:nth-child(3) {
      width: 40%;
    }

    &__term:nth-child(4) {
      width: 48%;
    }

    &__usp-list {
      gap: 7px;
    }

    &__pricing {
      min-height: 80px;
      padding-right: 82px;
    }

    &__old-price {
      width: 38%;
    }

    &__current-price {
      width: 78%;
    }

    &__price-note {
      width: 54%;
    }

    &__discount {
      width: 74px;
    }
  }

  @media (min-width: 1024px) {
    align-items: start;
    display: grid;
    gap: 16px;
    grid-template-columns: 240px minmax(0, 1fr) 320px;

    &__body {
      padding: 0;
    }

    &__media,
    &__image {
      height: 100%;
      min-height: 240px;
    }

    &__aside {
      align-self: stretch;
      border-left: 1px solid #e5e7eb;
      justify-content: space-between;
      min-height: 100%;
      padding-left: 12px;
      padding-top: 0;
      width: 100%;
    }

    &__tour-type {
      gap: 0;
    }

    &__tour-type-item {
      height: 40px;
    }

    &__pricing {
      min-height: 104px;
      padding-right: 104px;
      width: 100%;
    }

    &__old-price {
      width: 28%;
    }

    &__current-price {
      height: 40px;
      margin-top: 8px;
      width: 78%;
    }

    &__price-note {
      margin-top: 2px;
      width: 34%;
    }

    &__discount {
      height: 28px;
      right: -8px;
      width: 88px;
    }

    &__cashback {
      height: 50px;
    }

    &__button {
      height: 48px;
    }
  }

  @media (min-width: 1280px) {
    grid-template-columns: 300px minmax(0, 1fr) 300px;
  }
}
</style>
