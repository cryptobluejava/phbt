"use client"

import { useEffect, useRef } from "react"
import { createChart, ColorType, IChartApi, ISeriesApi, AreaData, Time, AreaSeries } from "lightweight-charts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw } from "lucide-react"
import { Trade } from "@/hooks/use-token-page-data"

interface TokenChartProps {
    trades: Trade[]
    isLoading: boolean
    onRefresh: () => void
}

export function TokenChart({ trades, isLoading, onRefresh }: TokenChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<IChartApi | null>(null)
    const seriesRef = useRef<ISeriesApi<"Area"> | null>(null)

    useEffect(() => {
        if (!chartContainerRef.current) return

        // Create chart
        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: "transparent" },
                textColor: "#9FA6A3",
            },
            grid: {
                vertLines: { color: "#2A3338" },
                horzLines: { color: "#2A3338" },
            },
            width: chartContainerRef.current.clientWidth,
            height: 300,
            rightPriceScale: {
                borderColor: "#2A3338",
            },
            timeScale: {
                borderColor: "#2A3338",
                timeVisible: true,
                secondsVisible: false,
            },
            crosshair: {
                vertLine: {
                    color: "#8C3A32",
                    width: 1,
                    style: 2,
                },
                horzLine: {
                    color: "#8C3A32",
                    width: 1,
                    style: 2,
                },
            },
        })

        chartRef.current = chart

        // Add area series (v5 API uses addSeries with AreaSeries)
        const areaSeries = chart.addSeries(AreaSeries, {
            topColor: "rgba(140, 58, 50, 0.56)",
            bottomColor: "rgba(140, 58, 50, 0.04)",
            lineColor: "#8C3A32",
            lineWidth: 2,
        })

        seriesRef.current = areaSeries

        // Handle resize
        const handleResize = () => {
            if (chartContainerRef.current && chartRef.current) {
                chartRef.current.applyOptions({
                    width: chartContainerRef.current.clientWidth,
                })
            }
        }

        window.addEventListener("resize", handleResize)

        return () => {
            window.removeEventListener("resize", handleResize)
            chart.remove()
        }
    }, [])

    // Update data when trades change
    useEffect(() => {
        if (!seriesRef.current || trades.length === 0) return

        // Convert trades to chart data (sorted by time ascending)
        const chartData: AreaData<Time>[] = [...trades]
            .sort((a, b) => a.timestamp - b.timestamp)
            .map((trade) => ({
                time: trade.timestamp as Time,
                value: trade.price * 1_000_000, // Show price in more readable units
            }))

        seriesRef.current.setData(chartData)

        // Fit content
        if (chartRef.current) {
            chartRef.current.timeScale().fitContent()
        }
    }, [trades])

    return (
        <Card>
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-8 bg-[#8C3A32]" />
                        <div>
                            <CardTitle className="text-lg">Price Chart</CardTitle>
                            <p className="text-xs text-[#5F6A6E] mt-0.5">
                                SOL per 1M tokens
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onRefresh}
                        disabled={isLoading}
                        className="p-2 rounded-lg hover:bg-[#1A2428] transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 text-[#9FA6A3] ${isLoading ? "animate-spin" : ""}`} />
                    </button>
                </div>
            </CardHeader>
            <CardContent>
                {trades.length === 0 && !isLoading ? (
                    <div className="flex items-center justify-center h-[300px] text-[#5F6A6E]">
                        No trade data available
                    </div>
                ) : (
                    <div ref={chartContainerRef} className="w-full" />
                )}
            </CardContent>
        </Card>
    )
}
