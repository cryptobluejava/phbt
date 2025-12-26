"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { createChart, ColorType, IChartApi, ISeriesApi, Time, CandlestickSeries, HistogramSeries, LineSeries, CrosshairMode } from "lightweight-charts"
import { RefreshCw, TrendingUp, TrendingDown, BarChart2, Activity } from "lucide-react"
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

type ChartType = "candle" | "line" | "area"

export function TradingChart({ trades, totalSupply, tokenSymbol, isLoading, isRefreshing, onRefresh }: TradingChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<IChartApi | null>(null)
    const mainSeriesRef = useRef<ISeriesApi<"Candlestick"> | ISeriesApi<"Line"> | null>(null)
    const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null)
    
    const [solPrice, setSolPrice] = useState<number>(0)
    const [currentPrice, setCurrentPrice] = useState<number>(0)
    const [priceChange24h, setPriceChange24h] = useState<number>(0)
    const [marketCap, setMarketCap] = useState<number>(0)
    const [volume24h, setVolume24h] = useState<number>(0)
    const [high24h, setHigh24h] = useState<number>(0)
    const [low24h, setLow24h] = useState<number>(0)
    const [chartType, setChartType] = useState<ChartType>("candle")

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

        // 24h stats
        const trades24h = sortedTrades.filter(t => t.timestamp > oneDayAgo)
        if (trades24h.length > 0) {
            const prices24h = trades24h.map(t => t.price * solPrice)
            setHigh24h(Math.max(...prices24h))
            setLow24h(Math.min(...prices24h))
            
            const volume = trades24h.reduce((sum, t) => sum + Math.abs(t.solAmount), 0)
            setVolume24h(volume * solPrice)

            const firstPrice24h = trades24h[0].price * solPrice
            const change = ((latestPrice - firstPrice24h) / firstPrice24h) * 100
            setPriceChange24h(change)
        } else if (sortedTrades.length > 1) {
            // Use all data if no 24h trades
            const firstPrice = sortedTrades[0].price * solPrice
            const change = ((latestPrice - firstPrice) / firstPrice) * 100
            setPriceChange24h(change)
        }
    }, [trades, totalSupply, solPrice])

    // Create and update chart
    const createChartInstance = useCallback(() => {
        if (!chartContainerRef.current) return

        // Clean up existing chart
        if (chartRef.current) {
            try {
                chartRef.current.remove()
            } catch {
                // Already disposed
            }
            chartRef.current = null
            mainSeriesRef.current = null
            volumeSeriesRef.current = null
        }

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: "#0a0f12" },
                textColor: "#6b7280",
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            },
            grid: {
                vertLines: { color: "#1f2937", style: 1 },
                horzLines: { color: "#1f2937", style: 1 },
            },
            width: chartContainerRef.current.clientWidth,
            height: 400,
            rightPriceScale: {
                borderColor: "#1f2937",
                scaleMargins: { top: 0.1, bottom: 0.25 },
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

        // Add volume series first (background)
        const volumeSeries = chart.addSeries(HistogramSeries, {
            color: "#8C3A3233",
            priceFormat: { type: "volume" },
            priceScaleId: "volume",
        })
        chart.priceScale("volume").applyOptions({
            scaleMargins: { top: 0.85, bottom: 0 },
        })
        volumeSeriesRef.current = volumeSeries

        // Add main price series based on chart type
        if (chartType === "candle") {
            const candleSeries = chart.addSeries(CandlestickSeries, {
                upColor: "#22c55e",
                downColor: "#ef4444",
                borderUpColor: "#22c55e",
                borderDownColor: "#ef4444",
                wickUpColor: "#22c55e",
                wickDownColor: "#ef4444",
            })
            mainSeriesRef.current = candleSeries as ISeriesApi<"Candlestick">
        } else {
            const lineSeries = chart.addSeries(LineSeries, {
                color: "#8C3A32",
                lineWidth: 2,
                crosshairMarkerVisible: true,
                crosshairMarkerRadius: 4,
            })
            mainSeriesRef.current = lineSeries as ISeriesApi<"Line">
        }

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
            }
        }
    }, [chartType])

    useEffect(() => {
        createChartInstance()
    }, [createChartInstance])

    // Update data
    useEffect(() => {
        if (!mainSeriesRef.current || trades.length === 0 || totalSupply === 0 || solPrice === 0) return

        const sortedTrades = [...trades].sort((a, b) => a.timestamp - b.timestamp)
        
        // Group trades into candles (5-minute intervals for granularity)
        const candleInterval = 300 // 5 minutes
        const candles = new Map<number, { open: number; high: number; low: number; close: number; volume: number }>()
        
        for (const trade of sortedTrades) {
            const candleTime = Math.floor(trade.timestamp / candleInterval) * candleInterval
            const price = trade.price * solPrice
            const volume = Math.abs(trade.solAmount) * solPrice
            
            const existing = candles.get(candleTime)
            if (existing) {
                existing.high = Math.max(existing.high, price)
                existing.low = Math.min(existing.low, price)
                existing.close = price
                existing.volume += volume
            } else {
                candles.set(candleTime, { open: price, high: price, low: price, close: price, volume })
            }
        }

        // Convert to chart data
        const candleData = Array.from(candles.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([time, data]) => ({
                time: time as Time,
                open: data.open,
                high: data.high,
                low: data.low,
                close: data.close,
            }))

        const volumeData = Array.from(candles.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([time, data]) => ({
                time: time as Time,
                value: data.volume,
                color: data.close >= data.open ? "#22c55e33" : "#ef444433",
            }))

        if (chartType === "candle") {
            (mainSeriesRef.current as ISeriesApi<"Candlestick">).setData(candleData)
        } else {
            const lineData = candleData.map(c => ({ time: c.time, value: c.close }))
            ;(mainSeriesRef.current as ISeriesApi<"Line">).setData(lineData)
        }

        volumeSeriesRef.current?.setData(volumeData)

        // Fit content
        chartRef.current?.timeScale().fitContent()
    }, [trades, totalSupply, solPrice, chartType])

    const formatPrice = (price: number) => {
        if (price < 0.00001) return `$${price.toExponential(2)}`
        if (price < 0.01) return `$${price.toFixed(6)}`
        if (price < 1) return `$${price.toFixed(4)}`
        return `$${price.toFixed(2)}`
    }

    return (
        <div className="bg-[#0a0f12] rounded-xl border border-[#1f2937] overflow-hidden">
            {/* Chart Header - Stats Bar */}
            <div className="px-4 py-3 border-b border-[#1f2937]">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    {/* Price & Change */}
                    <div className="flex items-center gap-6">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-white">
                                    {currentPrice > 0 ? formatPrice(currentPrice) : "--"}
                                </span>
                                <span className={`flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded ${
                                    priceChange24h >= 0 
                                        ? "bg-green-500/10 text-green-500" 
                                        : "bg-red-500/10 text-red-500"
                                }`}>
                                    {priceChange24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    {Math.abs(priceChange24h).toFixed(2)}%
                                </span>
                            </div>
                            <span className="text-xs text-gray-500">${tokenSymbol}/USD</span>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 text-sm">
                        <div className="hidden sm:block">
                            <span className="text-gray-500">24h High</span>
                            <p className="text-green-500 font-medium">{high24h > 0 ? formatPrice(high24h) : "--"}</p>
                        </div>
                        <div className="hidden sm:block">
                            <span className="text-gray-500">24h Low</span>
                            <p className="text-red-500 font-medium">{low24h > 0 ? formatPrice(low24h) : "--"}</p>
                        </div>
                        <div className="hidden md:block">
                            <span className="text-gray-500">24h Vol</span>
                            <p className="text-white font-medium">{volume24h > 0 ? formatUSD(volume24h) : "--"}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">MCap</span>
                            <p className="text-white font-medium">{marketCap > 0 ? formatUSD(marketCap) : "--"}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart Controls */}
            <div className="px-4 py-2 border-b border-[#1f2937] flex items-center justify-between">
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setChartType("candle")}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                            chartType === "candle" 
                                ? "bg-[#8C3A32] text-white" 
                                : "text-gray-400 hover:text-white hover:bg-[#1f2937]"
                        }`}
                    >
                        <BarChart2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setChartType("line")}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                            chartType === "line" 
                                ? "bg-[#8C3A32] text-white" 
                                : "text-gray-400 hover:text-white hover:bg-[#1f2937]"
                        }`}
                    >
                        <Activity className="w-4 h-4" />
                    </button>
                </div>
                
                <button
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    className="p-2 rounded hover:bg-[#1f2937] transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 text-gray-400 ${isRefreshing ? "animate-spin" : ""}`} />
                </button>
            </div>

            {/* Chart Container */}
            {trades.length === 0 && !isLoading ? (
                <div className="flex flex-col items-center justify-center h-[400px] text-center">
                    <BarChart2 className="w-12 h-12 text-gray-600 mb-3" />
                    <p className="text-gray-500 mb-1">No trades yet</p>
                    <p className="text-xs text-gray-600">Chart will populate after the first trade</p>
                </div>
            ) : (
                <div ref={chartContainerRef} className="w-full" />
            )}
        </div>
    )
}

