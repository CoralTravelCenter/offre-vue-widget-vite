<script setup lang="ts">
import { Skeleton } from "ui/skeleton";
</script>

<template>
  <section class="offre-map-view-skeleton" aria-hidden="true">
    <div class="offre-map-view-skeleton__canvas">
      <div class="offre-map-view-skeleton__panel">
        <div class="offre-map-view-skeleton__panel-head">
          <Skeleton class="offre-map-view-skeleton__title" />
          <Skeleton class="offre-map-view-skeleton__switch" />
        </div>

        <Skeleton class="offre-map-view-skeleton__search" />

        <div class="offre-map-view-skeleton__list">
          <div
            v-for="index in 4"
            :key="index"
            class="offre-map-view-skeleton__card"
          >
            <Skeleton class="offre-map-view-skeleton__card-media" />
            <div class="offre-map-view-skeleton__card-main">
              <Skeleton class="offre-map-view-skeleton__card-title" />
              <Skeleton class="offre-map-view-skeleton__card-location" />
              <Skeleton class="offre-map-view-skeleton__card-price" />
            </div>
          </div>
        </div>
      </div>

      <div class="offre-map-view-skeleton__map">
        <Skeleton class="offre-map-view-skeleton__marker offre-map-view-skeleton__marker--one" />
        <Skeleton class="offre-map-view-skeleton__marker offre-map-view-skeleton__marker--two" />
        <Skeleton class="offre-map-view-skeleton__marker offre-map-view-skeleton__marker--three" />
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.offre-map-view-skeleton__canvas {
  background: linear-gradient(180deg, #eef6fb 0%, #f7fbfd 100%);
  border-radius: 24px;
  min-height: 500px;
  overflow: hidden;
  position: relative;
}

.offre-map-view-skeleton__panel {
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid #f0f0f0;
  border-radius: 14px;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.08);
  display: none;
  left: 12px;
  overflow: hidden;
  position: absolute;
  top: 12px;
  width: 280px;
  z-index: 2;
}

.offre-map-view-skeleton__panel-head {
  display: grid;
  gap: 10px;
  padding: 12px 12px 8px;
}

.offre-map-view-skeleton__title {
  background-color: #e5e7eb;
  height: 18px;
  width: 128px;
}

.offre-map-view-skeleton__switch {
  background-color: #e5e7eb;
  height: 32px;
  width: 100%;
}

.offre-map-view-skeleton__search {
  background-color: #e5e7eb;
  height: 36px;
  margin: 0 12px 10px;
}

.offre-map-view-skeleton__list {
  display: grid;
  gap: 6px;
  padding: 0 12px 12px;
}

.offre-map-view-skeleton__card {
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  display: grid;
  gap: 8px;
  grid-template-columns: 64px minmax(0, 1fr);
  padding: 6px;
}

.offre-map-view-skeleton__card-media {
  background-color: #e5e7eb;
  border-radius: 8px;
  height: 64px;
  width: 64px;
}

.offre-map-view-skeleton__card-main {
  display: grid;
  gap: 6px;
}

.offre-map-view-skeleton__card-title {
  background-color: #e5e7eb;
  height: 16px;
  width: 82%;
}

.offre-map-view-skeleton__card-location {
  background-color: #e5e7eb;
  height: 14px;
  width: 58%;
}

.offre-map-view-skeleton__card-price {
  background-color: #e5e7eb;
  height: 18px;
  width: 46%;
}

.offre-map-view-skeleton__map {
  background:
    radial-gradient(circle at 20% 28%, rgba(22, 119, 255, 0.12) 0 4px, transparent 5px),
    radial-gradient(circle at 72% 34%, rgba(22, 119, 255, 0.12) 0 4px, transparent 5px),
    radial-gradient(circle at 58% 74%, rgba(22, 119, 255, 0.12) 0 4px, transparent 5px),
    linear-gradient(0deg, rgba(255,255,255,0.86), rgba(255,255,255,0.86)),
    linear-gradient(135deg, #f2f4f7 25%, transparent 25%) -16px 0/32px 32px,
    linear-gradient(225deg, #f2f4f7 25%, transparent 25%) -16px 0/32px 32px,
    linear-gradient(315deg, #f2f4f7 25%, transparent 25%) 0 0/32px 32px,
    linear-gradient(45deg, #f2f4f7 25%, #fbfcfd 25%) 0 0/32px 32px;
  height: 100%;
  inset: 0;
  position: absolute;
}

.offre-map-view-skeleton__marker {
  background-color: #d7ecfb;
  border-radius: 999px;
  height: 28px;
  position: absolute;
  width: 72px;
}

.offre-map-view-skeleton__marker--one {
  left: 38%;
  top: 28%;
}

.offre-map-view-skeleton__marker--two {
  left: 62%;
  top: 46%;
}

.offre-map-view-skeleton__marker--three {
  left: 48%;
  top: 66%;
}

@media (min-width: 1024px) {
  .offre-map-view-skeleton__canvas {
    height: 520px;
    min-height: 0;
  }

  .offre-map-view-skeleton__panel {
    display: block;
  }
}
</style>
