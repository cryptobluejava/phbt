"use client"

import { useEffect, useRef, useState } from "react"
import { createChart, ColorType, IChartApi, ISeriesApi, Time, AreaSeries } from "lightweight-charts"
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
    
    // Calculate current market cap from ACTUAL TRADE PRICE (in-platform price!)
    const latestTradePrice = trades.length > 0 ? trades[0].price : 0
    const currentMarketCap = latestTradePrice > 0 && totalSupply > 0 && solPrice > 0
        ? latestTradePrice * totalSupply * solPrice
        : 0

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

    // Create chart
    useEffect(() => {
        if (!chartContainerRef.current) return

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
                    bottom: 0.1,
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

        const areaSeries = chart.addSeries(AreaSeries, {
            topColor: "rgba(140, 58, 50, 0.56)",
            bottomColor: "rgba(140, 58, 50, 0.04)",
            lineColor: "#8C3A32",
            lineWidth: 2,
            priceFormat: {
                type: 'custom',
                formatter: (price: number) => {
                    if (price < 0) return '$0'
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
            if (chartRef.current) {
                try {
                    chartRef.current.remove()
                } catch {
                    // Already disposed
                }
                chartRef.current = null
                seriesRef.current = null
            }
        }
    }, [])

    // Update data when trades change or SOL price updates
    useEffect(() => {
        if (!seriesRef.current || trades.length === 0 || totalSupply === 0 || solPrice === 0) return

        // Sort trades by timestamp
        const sortedTrades = [...trades].sort((a, b) => a.timestamp - b.timestamp)
        
        // Create chart data - ensure unique timestamps by adding small increments
        const chartData: { time: Time; value: number }[] = []
        let lastTime = 0
        
        for (const trade of sortedTrades) {
            const marketCap = Math.max(0, trade.price * totalSupply * solPrice)
            // Ensure unique timestamps by adding milliseconds if needed
            let time = trade.timestamp
            if (time <= lastTime) {
                time = lastTime + 1
            }
            lastTime = time
            
            chartData.push({
                time: time as Time,
                value: marketCap,
            })
        }

        if (chartData.length > 0) {
            seriesRef.current.setData(chartData)
            
            // Fit content
            if (chartRef.current) {
                chartRef.current.timeScale().fitContent()
            }
        }
    }, [trades, totalSupply, solPrice])

    return (
        <Card>
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
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
                    
                    {/* Refresh */}
                    <button
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className="p-2 rounded-lg bg-[#0E1518] border border-[#2A3338] hover:border-[#8C3A32] transition-colors disabled:opacity-50"
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
