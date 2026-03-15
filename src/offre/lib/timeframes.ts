import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import minMax from "dayjs/plugin/minMax";
import "dayjs/locale/ru";
import type { NormalizedOffreWidgetOptions, NormalizedWidgetHotelDescriptor } from "offre/lib/payload";
import type { WidgetTimeframeConfig } from "shared/types/widget";

dayjs.extend(duration);
dayjs.extend(minMax);
dayjs.locale("ru");

export interface OffreSearchFields {
  beginDates: [string, string];
  nights: number[];
}

export interface OffreHotelTimeframeEntry {
  key: string;
  searchFields: OffreSearchFields;
}

function hasFixedStringTuple(value: WidgetTimeframeConfig["fixed"]): value is [string, string] {
  return Array.isArray(value)
    && value.length === 2
    && value.every((entry) => typeof entry === "string");
}

function conformNights(hotel: NormalizedWidgetHotelDescriptor, options: NormalizedOffreWidgetOptions) {
  const source = Array.isArray(hotel.nights) && hotel.nights.length ? hotel.nights : options.nights;

  return [...source].sort((left, right) => left - right);
}

function createSearchFields(
  since: dayjs.Dayjs,
  until: dayjs.Dayjs,
  hotel: NormalizedWidgetHotelDescriptor,
  options: NormalizedOffreWidgetOptions
): OffreSearchFields {
  return {
    beginDates: [since.startOf("day").format(), until.endOf("day").format()],
    nights: conformNights(hotel, options)
  };
}

function buildMonthlyTimeframes(
  since: dayjs.Dayjs,
  until: dayjs.Dayjs,
  hotel: NormalizedWidgetHotelDescriptor,
  options: NormalizedOffreWidgetOptions
) {
  const timeframes: OffreHotelTimeframeEntry[] = [];
  let currentSince = dayjs.max(dayjs(), since);
  let currentUntil = dayjs.min(currentSince.endOf("month"), until);

  while (currentSince.isBefore(until) || currentSince.isSame(until, "day")) {
    timeframes.push({
      key: currentSince.format("MMMM"),
      searchFields: createSearchFields(currentSince, currentUntil, hotel, options)
    });

    currentSince = currentSince.add(1, "month").startOf("month");
    currentUntil = dayjs.min(currentSince.endOf("month"), until);
  }

  return timeframes;
}

function buildFixedTimeframes(
  timeframe: WidgetTimeframeConfig,
  hotel: NormalizedWidgetHotelDescriptor,
  options: NormalizedOffreWidgetOptions
) {
  if (hasFixedStringTuple(timeframe.fixed)) {
    const [since, until] = timeframe.fixed.map((entry) => dayjs(entry)) as [dayjs.Dayjs, dayjs.Dayjs];

    if (timeframe.monthly) {
      return buildMonthlyTimeframes(since, until, hotel, options);
    }

    return [{
      key: "*",
      searchFields: createSearchFields(since, until, hotel, options)
    }];
  }

  if (!Array.isArray(timeframe.fixed)) {
    return [];
  }

  return timeframe.fixed.map((entry) => {
    const [since, until] = entry.frame.map((frameEntry) => dayjs(frameEntry)) as [dayjs.Dayjs, dayjs.Dayjs];

    return {
      key: entry.key,
      searchFields: createSearchFields(since, until, hotel, options)
    };
  });
}

function buildFluidTimeframes(
  timeframe: WidgetTimeframeConfig,
  hotel: NormalizedWidgetHotelDescriptor,
  options: NormalizedOffreWidgetOptions
) {
  if (!Array.isArray(timeframe.fluid) || timeframe.fluid.length !== 2) {
    return [];
  }

  const [since, until] = timeframe.fluid.map((entry) => dayjs().add(dayjs.duration(entry))) as [dayjs.Dayjs, dayjs.Dayjs];

  if (timeframe.monthly) {
    return buildMonthlyTimeframes(since, until, hotel, options);
  }

  return [{
    key: "*",
    searchFields: createSearchFields(since, until, hotel, options)
  }];
}

export function buildHotelTimeframes(
  hotel: NormalizedWidgetHotelDescriptor,
  options: NormalizedOffreWidgetOptions
) {
  const timeframe = hotel.timeframe ?? options.timeframe;

  if (timeframe.fixed) {
    return buildFixedTimeframes(timeframe, hotel, options);
  }

  if (timeframe.fluid) {
    return buildFluidTimeframes(timeframe, hotel, options);
  }

  return [];
}
