"use client"

import { useEffect, useRef, useState } from "react"
import { createChart, ColorType, IChartApi, ISeriesApi, AreaData, Time, AreaSeries } from "lightweight-charts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw } from "lucide-react"
import { Trade } from "@/hooks/use-token-page-data"
import { getSolPrice, formatUSD } from "@/lib/sol-price"
import { REFRESH_INTERVALS } from "@/lib/constants"

interface TokenChartProps {
    trades: Trade[]
    totalSupply: number
    isLoading: boolean
    isRefreshing: boolean
    onRefresh: () => void
}

export function TokenChart({ trades, totalSupply, isLoading, isRefreshing, onRefresh }: TokenChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<IChartApi | null>(null)
    const seriesRef = useRef<ISeriesApi<"Area"> | null>(null)
    const [solPrice, setSolPrice] = useState<number>(0)
    const [currentMarketCap, setCurrentMarketCap] = useState<number>(0)

    // Fetch SOL price on mount and periodically
    useEffect(() => {
        const fetchPrice = async () => {
            const price = await getSolPrice()
            setSolPrice(price)
        }
        fetchPrice()
        const interval = setInterval(fetchPrice, REFRESH_INTERVALS.SOL_PRICE)
        return () => clearInterval(interval)
    }, [])

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
                scaleMargins: {
                    top: 0.1,
                    bottom: 0, // Start at 0, never go negative
                },
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
            priceFormat: {
                type: 'custom',
                formatter: (price: number) => {
                    if (price < 0) return '$0' // Never show negative
                    if (price >= 1_000_000_000) return `$${(price / 1_000_000_000).toFixed(1)}B`
                    if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(1)}M`
                    if (price >= 1_000) return `$${(price / 1_000).toFixed(1)}K`
                    if (price >= 1) return `$${price.toFixed(0)}`
                    return `$${price.toFixed(2)}`
                },
            },
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

    // Update data when trades change or SOL price updates
    useEffect(() => {
        if (!seriesRef.current || trades.length === 0 || totalSupply === 0 || solPrice === 0) return

        // Convert trades to chart data showing market cap in USD
        // Ensure all values are positive (no negative market caps)
        const chartData: AreaData<Time>[] = [...trades]
            .sort((a, b) => a.timestamp - b.timestamp)
            .map((trade) => ({
                time: trade.timestamp as Time,
                // Market cap in USD = price per token (SOL) * total supply * SOL price
                value: Math.max(0, trade.price * totalSupply * solPrice),
            }))

        seriesRef.current.setData(chartData)

        // Update current market cap (latest trade)
        if (chartData.length > 0) {
            setCurrentMarketCap(chartData[chartData.length - 1].value)
        }

        // Fit content
        if (chartRef.current) {
            chartRef.current.timeScale().fitContent()
        }
    }, [trades, totalSupply, solPrice])

    return (
        <Card>
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-8 bg-[#8C3A32]" />
                        <div>
                            <CardTitle className="text-lg">
                                Market Cap {currentMarketCap > 0 && <span className="text-[#8C3A32]">{formatUSD(currentMarketCap)}</span>}
                            </CardTitle>
                            <p className="text-xs text-[#5F6A6E] mt-0.5">
                                {solPrice > 0 ? `SOL @ $${solPrice.toFixed(2)}` : "Loading price..."}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className="p-2 rounded-lg hover:bg-[#1A2428] transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 text-[#9FA6A3] ${isRefreshing ? "animate-spin" : ""}`} />
                    </button>
                </div>
            </CardHeader>
            <CardContent>
                {trades.length === 0 && !isLoading ? (
                    <div className="flex flex-col items-center justify-center h-[300px] text-center">
                        <p className="text-[#5F6A6E] mb-2">No trades yet</p>
                        <p className="text-xs text-[#5F6A6E]">Chart will populate after the first buy/sell transaction</p>
                    </div>
                ) : (
                    <div ref={chartContainerRef} className="w-full" />
                )}
            </CardContent>
        </Card>
    )
}
