"use client";

import { useCallback, useMemo } from "react";
import {
  AreaChart,
  BadgeDelta,
  Card,
  Flex,
  Grid,
  Metric,
  Text,
} from "@tremor/react";

import { calculateDeltaType } from "@/lib/data";

export const Metrics: React.FC<{ metrics: any }> = ({ metrics }) => {
  const flatten = useMemo(() => {
    if (!metrics?.rows) return [];
    return metrics?.rows
      .map((row: any) => {
        const date = row.keys[0];
        return {
          date,
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          position: row.position,
        };
      })
      .sort((a: any, b: any) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
  }, [metrics]);

  const valueFormatterNumber = useCallback(
    (digit: number) =>
      Intl.NumberFormat("en-US", {
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(digit),
    [],
  );

  const mata = useMemo(() => {
    return flatten.reduce(
      (acc: any, curr: any) => {
        const date = curr.date;
        const clicks = curr.clicks;
        const impressions = curr.impressions;
        const ctr = curr.ctr;
        const position = curr.position;
        return {
          ...acc,
          position: {
            last: position,
            delta: position - acc.position.last,
            value: [...acc.position.value, position],
          },
          clicks: {
            last: clicks,
            delta: clicks - acc.clicks.last,
            value: [...acc.clicks.value, clicks],
          },
          impressions: {
            last: impressions,
            delta: impressions - acc.impressions.last,
            value: [...acc.impressions.value, impressions],
          },
          ctr: {
            last: ctr,
            delta: ctr - acc.ctr.last,
            value: [...acc.ctr.value, ctr],
          },
        };
      },
      {
        clicks: {
          last: 0,
          delta: 0,
          value: [],
        },
        impressions: {
          last: 0,
          delta: 0,
          value: [],
        },
        ctr: {
          last: 0,
          delta: 0,
          value: [],
        },
        position: {
          last: 0,
          delta: 0,
          value: [],
        },
      },
    );
  }, [metrics]);

  const categories = useMemo(() => {
    return [
      {
        title: "Impressions",
        key: "impressions",
        metric: mata.impressions.last,
        metricPrev: mata.impressions.last - mata.impressions.delta,
        delta: mata.impressions.delta,
        deltaType: calculateDeltaType(
          mata.impressions.last,
          mata.impressions.delta,
        ),
      },
      {
        title: "Clicks",
        key: "clicks",
        metric: mata.clicks.last,
        metricPrev: mata.clicks.last - mata.clicks.delta,
        delta: mata.clicks.delta,
        deltaType: calculateDeltaType(mata.clicks.last, mata.clicks.delta),
      },
      {
        title: "CTR",
        key: "ctr",
        metric: Number(mata.ctr.last).toFixed(2),
        metricPrev: Number(mata.ctr.last - mata.ctr.delta).toFixed(2),
        delta: Number(mata.ctr.delta).toFixed(2),
        deltaType: calculateDeltaType(mata.ctr.last, mata.ctr.delta),
      },
      {
        title: "Position",
        key: "position",
        metric: Math.round(mata.position.last),
        metricPrev: Math.round(mata.position.last - mata.position.delta),
        delta: Math.round(mata.position.delta),
        deltaType: calculateDeltaType(mata.position.last, mata.position.delta),
      },
    ];
  }, [mata]);
  return (
    <Grid numItemsSm={2} numItemsLg={4} className="gap-6">
      {categories.map((item) => (
        <Card key={item.title}>
          <Flex alignItems="start">
            <Text>{item.title}</Text>
            <BadgeDelta deltaType={item.deltaType}>
              {valueFormatterNumber(item.delta)}
            </BadgeDelta>
          </Flex>
          <Flex
            className="space-x-3 truncate"
            justifyContent="start"
            alignItems="baseline"
          >
            <Metric>{valueFormatterNumber(item.metric)}</Metric>
            <Text>from {valueFormatterNumber(item.metricPrev as number)}</Text>
          </Flex>
          <AreaChart
            className="mt-6 h-28"
            data={flatten}
            index="date"
            valueFormatter={(number: number) =>
              `${Intl.NumberFormat("us").format(number).toString()}`
            }
            categories={[item.key]}
            colors={["blue"]}
            showXAxis={true}
            showGridLines={false}
            startEndOnly={true}
            showYAxis={false}
            showLegend={false}
          />
        </Card>
      ))}
    </Grid>
  );
};
// const valueFormatterNumber = (number: number) =>
//   `${Intl.NumberFormat("us").format(number).toString()}`;
