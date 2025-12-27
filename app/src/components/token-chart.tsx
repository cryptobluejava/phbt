"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { 
    createChart, 
    ColorType, 
    IChartApi, 
    ISeriesApi, 
    Time, 
    CandlestickSeries,
    LineSeries,
    AreaSeries,
    HistogramSeries,
    CrosshairMode,
    LineStyle,
} from "lightweight-charts"
import { RefreshCw, TrendingUp, TrendingDown, BarChart2, Activity, TrendingUp as LineIcon } from "lucide-react"
import { Trade } from "@/hooks/use-token-page-data"
import { getSolPrice } from "@/lib/sol-price"
import { REFRESH_INTERVALS } from "@/lib/constants"

interface TokenChartProps {
    trades: Trade[]
    totalSupply: number
    isLoading: boolean
    isRefreshing: boolean
    onRefresh: () => void
}

type ChartType = 'candle' | 'line' | 'area'
type TimeFrame = '1s' | '1m' | '1H' | '1D' | 'ALL'

interface OHLC {
    time: Time
    open: number
    high: number
    low: number
    close: number
    volume: number
}

export function TokenChart({ trades, totalSupply, isLoading, isRefreshing, onRefresh }: TokenChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<IChartApi | null>(null)
    const mainSeriesRef = useRef<ISeriesApi<"Candlestick"> | ISeriesApi<"Line"> | ISeriesApi<"Area"> | null>(null)
    const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null)
    
    const [solPrice, setSolPrice] = useState<number>(0)
    const [chartType, setChartType] = useState<ChartType>('candle') // Default to candlestick
    const [timeFrame, setTimeFrame] = useState<TimeFrame>('1s') // Default to 1s for detailed history
    
    // Calculate stats from trades
    const latestTradePrice = trades.length > 0 ? trades[0].price : 0
    const currentMarketCap = latestTradePrice > 0 && totalSupply > 0 && solPrice > 0
        ? latestTradePrice * totalSupply * solPrice
        : 0
    
    // Calculate 24h stats
    const stats = useCallback(() => {
        if (trades.length === 0 || solPrice === 0 || totalSupply === 0) {
            return { high: 0, low: 0, volume: 0, change: 0 }
        }
        
        const now = Date.now() / 1000
        const dayAgo = now - (24 * 60 * 60)
        const recentTrades = trades.filter(t => t.timestamp >= dayAgo)
        const tradesToUse = recentTrades.length > 0 ? recentTrades : trades
        
        const marketCaps = tradesToUse.map(t => t.price * totalSupply * solPrice)
        const high = Math.max(...marketCaps)
        const low = Math.min(...marketCaps)
        const volume = tradesToUse.reduce((sum, t) => sum + t.solAmount, 0)
        
        const sortedTrades = [...tradesToUse].sort((a, b) => a.timestamp - b.timestamp)
        const openPrice = sortedTrades[0]?.price || 0
        const closePrice = sortedTrades[sortedTrades.length - 1]?.price || 0
        const openMC = openPrice * totalSupply * solPrice
        const closeMC = closePrice * totalSupply * solPrice
        const change = openMC > 0 ? ((closeMC - openMC) / openMC) * 100 : 0
        
        return { high, low, volume, change }
    }, [trades, solPrice, totalSupply])
    
    const chartStats = stats()

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

    // Convert trades to chart data
    const getChartData = useCallback(() => {
        if (trades.length === 0 || solPrice === 0 || totalSupply === 0) return { ohlc: [], line: [] }
        
        const sortedTrades = [...trades].sort((a, b) => a.timestamp - b.timestamp)
        
        // For 1s timeframe, show each trade as a separate point (best for seeing all price shifts)
        if (timeFrame === '1s') {
            const lineData: { time: Time; value: number }[] = []
            const ohlcData: OHLC[] = []
            let lastTime = 0
            
            for (const trade of sortedTrades) {
                const marketCap = trade.price * totalSupply * solPrice
                // Ensure unique timestamps
                let time = trade.timestamp
                if (time <= lastTime) {
                    time = lastTime + 1
                }
                lastTime = time
                
                lineData.push({ time: time as Time, value: marketCap })
                
                // Create a candle for each trade (will be a single point)
                ohlcData.push({
                    time: time as Time,
                    open: marketCap,
                    high: marketCap,
                    low: marketCap,
                    close: marketCap,
                    volume: trade.solAmount,
                })
            }
            
            return { ohlc: ohlcData, line: lineData }
        }
        
        // For other timeframes, aggregate into candles
        let intervalSeconds = 60
        switch (timeFrame) {
            case '1m': intervalSeconds = 60; break
            case '1H': intervalSeconds = 3600; break
            case '1D': intervalSeconds = 86400; break
            case 'ALL': 
                const range = (sortedTrades[sortedTrades.length - 1]?.timestamp || 0) - (sortedTrades[0]?.timestamp || 0)
                intervalSeconds = Math.max(3600, Math.floor(range / 20) || 3600)
                break
        }
        
        // Group trades into candles
        const candles: Map<number, OHLC> = new Map()
        const prices: Map<number, number[]> = new Map() // Track all prices per bucket
        
        for (const trade of sortedTrades) {
            const marketCap = trade.price * totalSupply * solPrice
            const bucketTime = Math.floor(trade.timestamp / intervalSeconds) * intervalSeconds
            
            if (!prices.has(bucketTime)) {
                prices.set(bucketTime, [])
            }
            prices.get(bucketTime)!.push(marketCap)
            
            if (candles.has(bucketTime)) {
                const candle = candles.get(bucketTime)!
                candle.high = Math.max(candle.high, marketCap)
                candle.low = Math.min(candle.low, marketCap)
                candle.close = marketCap
                candle.volume += trade.solAmount
            } else {
                candles.set(bucketTime, {
                    time: bucketTime as Time,
                    open: marketCap,
                    high: marketCap,
                    low: marketCap,
                    close: marketCap,
                    volume: trade.solAmount,
                })
            }
        }
        
        const ohlcData = Array.from(candles.values()).sort((a, b) => (a.time as number) - (b.time as number))
        const lineData = ohlcData.map(d => ({ time: d.time, value: d.close }))
        
        return { ohlc: ohlcData, line: lineData }
    }, [trades, solPrice, totalSupply, timeFrame])

    // Create chart
    useEffect(() => {
        if (!chartContainerRef.current) return

        // Clean up
        if (chartRef.current) {
            try { chartRef.current.remove() } catch {}
            chartRef.current = null
            mainSeriesRef.current = null
            volumeSeriesRef.current = null
        }

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: "#0a0e10" },
                textColor: "#6B7280",
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: 11,
                attributionLogo: false,
            },
            grid: {
                vertLines: { color: "rgba(55, 65, 81, 0.3)" },
                horzLines: { color: "rgba(55, 65, 81, 0.3)" },
            },
            width: chartContainerRef.current.clientWidth,
            height: 400,
            rightPriceScale: {
                borderColor: "transparent",
                scaleMargins: { top: 0.1, bottom: 0.2 },
            },
            timeScale: {
                borderColor: "transparent",
                timeVisible: true,
                secondsVisible: timeFrame === '1s',
                rightOffset: 10,
                barSpacing: chartType === 'candle' ? 15 : 8, // Zoomed out to show more data
                minBarSpacing: chartType === 'candle' ? 8 : 3,
            },
            crosshair: {
                mode: CrosshairMode.Normal,
                vertLine: { color: "rgba(140, 58, 50, 0.5)", width: 1, style: LineStyle.Dashed },
                horzLine: { color: "rgba(140, 58, 50, 0.5)", width: 1, style: LineStyle.Dashed },
            },
            handleScroll: { mouseWheel: true, pressedMouseMove: true },
            handleScale: { mouseWheel: true, pinch: true },
        })

        chartRef.current = chart

        const priceFormatter = (price: number) => {
            if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(2)}M`
            if (price >= 1_000) return `$${(price / 1_000).toFixed(2)}K`
            return `$${price.toFixed(2)}`
        }

        // Add series based on chart type
        if (chartType === 'candle') {
            const series = chart.addSeries(CandlestickSeries, {
                upColor: '#22c55e',      // Green for up
                downColor: '#ef4444',    // Red for down
                borderUpColor: '#16a34a',
                borderDownColor: '#dc2626',
                wickUpColor: '#22c55e',
                wickDownColor: '#ef4444',
                priceFormat: { type: 'custom', formatter: priceFormatter },
            })
            mainSeriesRef.current = series
        } else if (chartType === 'line') {
            const series = chart.addSeries(LineSeries, {
                color: '#8C3A32',
                lineWidth: 2,
                crosshairMarkerVisible: true,
                crosshairMarkerRadius: 4,
                priceFormat: { type: 'custom', formatter: priceFormatter },
            })
            mainSeriesRef.current = series
        } else {
            // Area chart (the old default)
            const series = chart.addSeries(AreaSeries, {
                topColor: 'rgba(140, 58, 50, 0.4)',
                bottomColor: 'rgba(140, 58, 50, 0.0)',
                lineColor: '#8C3A32',
                lineWidth: 2,
                crosshairMarkerVisible: true,
                crosshairMarkerRadius: 4,
                priceFormat: { type: 'custom', formatter: priceFormatter },
            })
            mainSeriesRef.current = series
        }

        // Volume
        const volumeSeries = chart.addSeries(HistogramSeries, {
            priceFormat: { type: 'volume' },
            priceScaleId: 'volume',
        })
        volumeSeriesRef.current = volumeSeries
        chart.priceScale('volume').applyOptions({
            scaleMargins: { top: 0.85, bottom: 0 },
        })

        const handleResize = () => {
            if (chartContainerRef.current && chartRef.current) {
                chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth })
            }
        }
        window.addEventListener("resize", handleResize)

        return () => {
            window.removeEventListener("resize", handleResize)
            if (chartRef.current) {
                try { chartRef.current.remove() } catch {}
                chartRef.current = null
            }
        }
    }, [chartType, timeFrame])

    // Update data
    useEffect(() => {
        if (!mainSeriesRef.current || !volumeSeriesRef.current) return
        if (trades.length === 0 || totalSupply === 0 || solPrice === 0) return

        const { ohlc, line } = getChartData()
        if (ohlc.length === 0) return

        if (chartType === 'candle') {
            // For candlesticks, add visual spread to make candles look like real candles
            (mainSeriesRef.current as ISeriesApi<"Candlestick">).setData(
                ohlc.map((d, i) => {
                    // Determine if this is a bullish or bearish candle
                    const prevClose = i > 0 ? ohlc[i - 1].close : d.open
                    const isBullish = d.close >= prevClose
                    
                    let { open, high, low, close } = d
                    
                    // Make candles REALLY fat - 6% body spread for chunky candles
                    const bodySpread = Math.max(d.close * 0.06, 100) // 6% or $100 minimum for body
                    const wickSpread = Math.max(d.close * 0.025, 40) // 2.5% for wicks
                    
                    // Always create a visible fat body
                    if (isBullish) {
                        open = close - bodySpread
                    } else {
                        open = close + bodySpread
                    }
                    
                    // Always add wicks for that classic candle look
                    const bodyHigh = Math.max(open, close)
                    const bodyLow = Math.min(open, close)
                    high = bodyHigh + wickSpread
                    low = bodyLow - wickSpread
                    
                    return { time: d.time, open, high, low, close }
                })
            )
        } else {
            // Line or Area chart
            (mainSeriesRef.current as ISeriesApi<"Line"> | ISeriesApi<"Area">).setData(line)
        }

        // Volume bars - color based on price movement
        volumeSeriesRef.current.setData(
            ohlc.map((d, i) => {
                const isUp = i === 0 ? true : d.close >= ohlc[i - 1].close
                return {
                    time: d.time,
                    value: d.volume,
                    color: isUp ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)',
                }
            })
        )

        chartRef.current?.timeScale().fitContent()
    }, [trades, totalSupply, solPrice, chartType, timeFrame, getChartData])

    const formatMC = (value: number) => {
        if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
        if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`
        return `$${value.toFixed(2)}`
    }

    return (
        <div className="flex flex-col bg-[#0a0e10] rounded-xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-[#1f2937]">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    {/* Price Info */}
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-white tabular-nums">
                                {currentMarketCap > 0 ? formatMC(currentMarketCap) : '--'}
                            </span>
                            {chartStats.change !== 0 && (
                                <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-sm font-medium ${
                                    chartStats.change >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                }`}>
                                    {chartStats.change >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                                    {chartStats.change >= 0 ? '+' : ''}{chartStats.change.toFixed(2)}%
                                </span>
                            )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            Market Cap • SOL @ ${solPrice.toFixed(2)}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Chart Type - 3 options */}
                        <div className="flex bg-[#1f2937] rounded-lg p-1">
                            <button
                                onClick={() => setChartType('area')}
                                className={`px-3 py-1.5 rounded text-xs font-medium transition-all flex items-center gap-1 ${
                                    chartType === 'area' ? 'bg-[#8C3A32] text-white' : 'text-gray-400 hover:text-white'
                                }`}
                                title="Area Chart"
                            >
                                <Activity className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setChartType('line')}
                                className={`px-3 py-1.5 rounded text-xs font-medium transition-all flex items-center gap-1 ${
                                    chartType === 'line' ? 'bg-[#8C3A32] text-white' : 'text-gray-400 hover:text-white'
                                }`}
                                title="Line Chart"
                            >
                                <LineIcon className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setChartType('candle')}
                                className={`px-3 py-1.5 rounded text-xs font-medium transition-all flex items-center gap-1 ${
                                    chartType === 'candle' ? 'bg-[#8C3A32] text-white' : 'text-gray-400 hover:text-white'
                                }`}
                                title="Candlestick Chart"
                            >
                                <BarChart2 className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Time Frame - with 1s for detailed */}
                        <div className="flex bg-[#1f2937] rounded-lg p-1">
                            {(['1s', '1m', '1H', '1D', 'ALL'] as TimeFrame[]).map((tf) => (
                                <button
                                    key={tf}
                                    onClick={() => setTimeFrame(tf)}
                                    className={`px-2.5 py-1.5 rounded text-xs font-medium transition-all ${
                                        timeFrame === tf ? 'bg-[#8C3A32] text-white' : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    {tf}
                                </button>
                            ))}
                        </div>

                        {/* Refresh */}
                        <button
                            onClick={onRefresh}
                            disabled={isRefreshing}
                            className="p-2 rounded-lg bg-[#1f2937] text-gray-400 hover:text-white transition-all disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 mt-3 text-xs">
                    <div>
                        <span className="text-gray-500">24h High </span>
                        <span className="text-emerald-400 font-medium">{chartStats.high > 0 ? formatMC(chartStats.high) : '--'}</span>
                    </div>
                    <div>
                        <span className="text-gray-500">24h Low </span>
                        <span className="text-red-400 font-medium">{chartStats.low > 0 ? formatMC(chartStats.low) : '--'}</span>
                    </div>
                    <div>
                        <span className="text-gray-500">24h Vol </span>
                        <span className="text-white font-medium">{chartStats.volume > 0 ? `${chartStats.volume.toFixed(2)} SOL` : '--'}</span>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="relative">
                {trades.length === 0 && !isLoading ? (
                    <div className="flex flex-col items-center justify-center h-[400px] text-center">
                        <BarChart2 className="w-12 h-12 text-gray-700 mb-3" />
                        <p className="text-gray-500 text-sm">No trading data yet</p>
                    </div>
                ) : (
                    <div ref={chartContainerRef} className="w-full" />
                )}
                {isLoading && trades.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#0a0e10]/80">
                        <RefreshCw className="w-6 h-6 text-[#8C3A32] animate-spin" />
                    </div>
                )}
            </div>
        </div>
    )
}
