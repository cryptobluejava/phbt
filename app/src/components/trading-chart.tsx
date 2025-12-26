"use client"

import { useEffect, useRef, useState } from "react"
import { createChart, ColorType, IChartApi, ISeriesApi, Time, AreaSeries, HistogramSeries, CrosshairMode } from "lightweight-charts"
import { RefreshCw, TrendingUp, TrendingDown, Activity } from "lucide-react"
import { Trade } from "@/hooks/use-token-page-data"
import { getSolPrice, formatUSD } from "@/lib/sol-price"
import { REFRESH_INTERVALS } from "@/lib/constants"

interface TradingChartProps {
    trades: Trade[]
    totalSupply: number
    tokenSymbol: string
    isLoading: boolean
    isRefreshing: boolean
    onRefresh: () => void
}

export function TradingChart({ trades, totalSupply, tokenSymbol, isLoading, isRefreshing, onRefresh }: TradingChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<IChartApi | null>(null)
    const seriesRef = useRef<ISeriesApi<"Area"> | null>(null)
    const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null)
    
    const [solPrice, setSolPrice] = useState<number>(0)
    const [currentPrice, setCurrentPrice] = useState<number>(0)
    const [marketCap, setMarketCap] = useState<number>(0)
    const [priceChange, setPriceChange] = useState<number>(0)
    const [volume24h, setVolume24h] = useState<number>(0)
    const [high24h, setHigh24h] = useState<number>(0)
    const [low24h, setLow24h] = useState<number>(0)

    // Fetch SOL price
    useEffect(() => {
        const fetchPrice = async () => {
            const price = await getSolPrice()
            setSolPrice(price)
        }
        fetchPrice()
        const interval = setInterval(fetchPrice, REFRESH_INTERVALS.SOL_PRICE)
        return () => clearInterval(interval)
    }, [])

    // Calculate stats
    useEffect(() => {
        if (trades.length === 0 || totalSupply === 0 || solPrice === 0) return

        const now = Date.now() / 1000
        const oneDayAgo = now - 86400

        const sortedTrades = [...trades].sort((a, b) => a.timestamp - b.timestamp)
        const latestTrade = sortedTrades[sortedTrades.length - 1]
        const latestPrice = latestTrade.price * solPrice
        
        setCurrentPrice(latestPrice)
        setMarketCap(latestPrice * totalSupply)

        // Calculate stats
        const allPrices = sortedTrades.map(t => t.price * solPrice)
        const trades24h = sortedTrades.filter(t => t.timestamp > oneDayAgo)
        
        if (trades24h.length > 0) {
            const prices24h = trades24h.map(t => t.price * solPrice)
            setHigh24h(Math.max(...prices24h))
            setLow24h(Math.min(...prices24h))
            
            const volume = trades24h.reduce((sum, t) => sum + Math.abs(t.solAmount), 0)
            setVolume24h(volume * solPrice)

            const firstPrice24h = trades24h[0].price * solPrice
            const change = ((latestPrice - firstPrice24h) / firstPrice24h) * 100
            setPriceChange(change)
        } else {
            setHigh24h(Math.max(...allPrices))
            setLow24h(Math.min(...allPrices))
            
            if (sortedTrades.length > 1) {
                const firstPrice = sortedTrades[0].price * solPrice
                const change = ((latestPrice - firstPrice) / firstPrice) * 100
                setPriceChange(change)
            }
            
            const totalVolume = sortedTrades.reduce((sum, t) => sum + Math.abs(t.solAmount), 0)
            setVolume24h(totalVolume * solPrice)
        }
    }, [trades, totalSupply, solPrice])

    // Create chart
    useEffect(() => {
        if (!chartContainerRef.current) return

        // Clean up existing
        if (chartRef.current) {
            try {
                chartRef.current.remove()
            } catch {
                // Already disposed
            }
            chartRef.current = null
            seriesRef.current = null
            volumeSeriesRef.current = null
        }

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: "#0a0f12" },
                textColor: "#6b7280",
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            },
            grid: {
                vertLines: { color: "#1f293744" },
                horzLines: { color: "#1f293744" },
            },
            width: chartContainerRef.current.clientWidth,
            height: 400,
            rightPriceScale: {
                borderColor: "#1f2937",
                scaleMargins: { top: 0.1, bottom: 0.2 },
                borderVisible: false,
            },
            timeScale: {
                borderColor: "#1f2937",
                timeVisible: true,
                secondsVisible: false,
                borderVisible: false,
            },
            crosshair: {
                mode: CrosshairMode.Normal,
                vertLine: {
                    color: "#8C3A32",
                    width: 1,
                    style: 2,
                    labelBackgroundColor: "#8C3A32",
                },
                horzLine: {
                    color: "#8C3A32",
                    width: 1,
                    style: 2,
                    labelBackgroundColor: "#8C3A32",
                },
            },
        })

        chartRef.current = chart

        // Volume series (background)
        const volumeSeries = chart.addSeries(HistogramSeries, {
            color: "#8C3A3233",
            priceFormat: { type: "volume" },
            priceScaleId: "volume",
        })
        chart.priceScale("volume").applyOptions({
            scaleMargins: { top: 0.85, bottom: 0 },
        })
        volumeSeriesRef.current = volumeSeries

        // Price area series
        const areaSeries = chart.addSeries(AreaSeries, {
            topColor: "rgba(140, 58, 50, 0.5)",
            bottomColor: "rgba(140, 58, 50, 0.02)",
            lineColor: "#8C3A32",
            lineWidth: 2,
            crosshairMarkerVisible: true,
            crosshairMarkerRadius: 5,
            crosshairMarkerBackgroundColor: "#8C3A32",
            crosshairMarkerBorderColor: "#fff",
            crosshairMarkerBorderWidth: 2,
            priceFormat: {
                type: 'custom',
                formatter: (price: number) => {
                    if (price === 0) return '$0'
                    if (price < 0.0000001) return `$${price.toExponential(1)}`
                    if (price < 0.00001) return `$${price.toFixed(7)}`
                    if (price < 0.0001) return `$${price.toFixed(6)}`
                    if (price < 0.001) return `$${price.toFixed(5)}`
                    if (price < 0.01) return `$${price.toFixed(4)}`
                    if (price < 1) return `$${price.toFixed(3)}`
                    return `$${price.toFixed(2)}`
                },
            },
        })
        seriesRef.current = areaSeries

        // Handle resize
        const handleResize = () => {
            if (chartContainerRef.current && chartRef.current) {
                chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth })
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

    // Update data
    useEffect(() => {
        if (!seriesRef.current || trades.length === 0 || totalSupply === 0 || solPrice === 0) return

        const sortedTrades = [...trades].sort((a, b) => a.timestamp - b.timestamp)
        
        // Create chart data with PRICE on Y-axis
        const priceData: { time: Time; value: number }[] = []
        const volumeData: { time: Time; value: number; color: string }[] = []
        let lastTime = 0
        
        for (const trade of sortedTrades) {
            const price = trade.price * solPrice
            const volume = Math.abs(trade.solAmount) * solPrice
            
            let time = trade.timestamp
            if (time <= lastTime) {
                time = lastTime + 1
            }
            lastTime = time
            
            priceData.push({
                time: time as Time,
                value: price,
            })
            
            volumeData.push({
                time: time as Time,
                value: volume,
                color: trade.type === "buy" ? "#22c55e33" : "#ef444433",
            })
        }

        seriesRef.current.setData(priceData)
        volumeSeriesRef.current?.setData(volumeData)

        // Fit content
        chartRef.current?.timeScale().fitContent()
    }, [trades, totalSupply, solPrice])

    return (
        <div className="bg-[#0a0f12] rounded-xl border border-[#1f2937] overflow-hidden">
            {/* Header - Show MARKET CAP prominently */}
            <div className="px-4 py-3 border-b border-[#1f2937]">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    {/* Market Cap & Change */}
                    <div className="flex items-center gap-6">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-white">
                                    {marketCap > 0 ? formatUSD(marketCap) : "--"}
                                </span>
                                {priceChange !== 0 && (
                                    <span className={`flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded ${
                                        priceChange >= 0 
                                            ? "bg-green-500/10 text-green-500" 
                                            : "bg-red-500/10 text-red-500"
                                    }`}>
                                        {priceChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                        {Math.abs(priceChange).toFixed(2)}%
                                    </span>
                                )}
                            </div>
                            <span className="text-xs text-gray-500">Market Cap • ${tokenSymbol}</span>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 text-sm">
                        <div className="hidden sm:block">
                            <span className="text-gray-500">High</span>
                            <p className="text-green-400 font-medium">{high24h > 0 ? formatUSD(high24h * totalSupply) : "--"}</p>
                        </div>
                        <div className="hidden sm:block">
                            <span className="text-gray-500">Low</span>
                            <p className="text-red-400 font-medium">{low24h > 0 ? formatUSD(low24h * totalSupply) : "--"}</p>
                        </div>
                        <div className="hidden md:block">
                            <span className="text-gray-500">Volume</span>
                            <p className="text-white font-medium">{volume24h > 0 ? formatUSD(volume24h) : "--"}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">SOL</span>
                            <p className="text-white font-medium">${solPrice.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart Controls */}
            <div className="px-4 py-2 border-b border-[#1f2937] flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-[#8C3A32]" />
                        Price Chart (USD)
                    </span>
                </div>
                
                <button
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    className="p-2 rounded hover:bg-[#1f2937] transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 text-gray-400 ${isRefreshing ? "animate-spin" : ""}`} />
                </button>
            </div>

            {/* Chart */}
            {trades.length === 0 && !isLoading ? (
                <div className="flex flex-col items-center justify-center h-[400px] text-center">
                    <Activity className="w-12 h-12 text-gray-600 mb-3" />
                    <p className="text-gray-500 mb-1">No trades yet</p>
                    <p className="text-xs text-gray-600">Chart will populate after the first trade</p>
                </div>
            ) : (
                <div ref={chartContainerRef} className="w-full" />
            )}
        </div>
    )
}
