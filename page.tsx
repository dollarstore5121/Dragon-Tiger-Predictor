"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Target, Delete, RotateCcw, ArrowLeft, Download, HelpCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type Result = "dragon" | "tiger" | "tie"
type Mode = "Normal" | "Advanced" | "Expert"
type InputMode = "automatic" | "manual"
type ToolPerformance = {
  totalPredictions: number
  correctPredictions: number
}

export default function DragonTigerPredictor() {
  const [results, setResults] = useState<Result[]>([])
  const [prediction, setPrediction] = useState<string>("")
  const [predictionMode, setPredictionMode] = useState<Mode>("Normal")
  const [inputMode, setInputMode] = useState<InputMode>("manual")
  const [history, setHistory] = useState<Result[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [userFeedback, setUserFeedback] = useState<boolean | null>(null)
  const [modeStats, setModeStats] = useState<Record<Mode, { correct: number; total: number }>>({
    Normal: { correct: 0, total: 0 },
    Advanced: { correct: 0, total: 0 },
    Expert: { correct: 0, total: 0 },
  })
  const [toolPerformance, setToolPerformance] = useState<ToolPerformance>({
    totalPredictions: 0,
    correctPredictions: 0,
  })

  const addResult = (type: Result) => {
    if (results.length >= 5) return
    setResults((prev) => [...prev, type])
  }

  const backspace = () => {
    setResults((prev) => prev.slice(0, -1))
    if (results.length <= 5) {
      setPrediction("")
    }
  }

  const clear = () => {
    setResults([])
    setPrediction("")
  }

  const reset = () => {
    clear()
    setHistory([])
    setModeStats({
      Normal: { correct: 0, total: 0 },
      Advanced: { correct: 0, total: 0 },
      Expert: { correct: 0, total: 0 },
    })
    setToolPerformance({
      totalPredictions: 0,
      correctPredictions: 0,
    })
  }

  const calculatePrediction = useCallback(() => {
    if (results.length < 5) return

    setIsProcessing(true)

    // Enhanced prediction algorithm
    const patterns = {
      dragonStreak: results.filter((r, i, arr) => r === "dragon" && arr[i - 1] === "dragon").length,
      tigerStreak: results.filter((r, i, arr) => r === "tiger" && arr[i - 1] === "tiger").length,
      alternating: results.filter((r, i, arr) => r !== arr[i - 1]).length >= 3,
      tieFrequency: results.filter((r) => r === "tie").length,
    }

    setTimeout(() => {
      let prediction = ""

      switch (predictionMode) {
        case "Normal":
          prediction = patterns.dragonStreak > patterns.tigerStreak ? "Tiger" : "Dragon"
          break
        case "Advanced":
          if (patterns.alternating) {
            prediction = results[results.length - 1] === "dragon" ? "Tiger" : "Dragon"
          } else {
            prediction = patterns.dragonStreak > 2 ? "Tiger" : "Dragon"
          }
          break
        case "Expert":
          if (patterns.tieFrequency >= 2) {
            prediction = "Dragon/Tiger (High variance detected)"
          } else {
            prediction = patterns.alternating ? "Follow trend" : "Break pattern"
          }
          break
      }

      setPrediction(prediction)
      setHistory((prev) => [...prev, results[results.length - 1]])
      setIsProcessing(false)
    }, 1000)
  }, [results, predictionMode])

  useEffect(() => {
    if (inputMode === "automatic" && results.length === 5) {
      calculatePrediction()
    }
    if (userFeedback !== null) {
      setModeStats((prev) => ({
        ...prev,
        [predictionMode]: {
          correct: prev[predictionMode].correct + (userFeedback ? 1 : 0),
          total: prev[predictionMode].total + 1,
        },
      }))
      setToolPerformance((prev) => ({
        totalPredictions: prev.totalPredictions + 1,
        correctPredictions: prev.correctPredictions + (userFeedback ? 1 : 0),
      }))
      setUserFeedback(null)
    }
  }, [results, inputMode, userFeedback, calculatePrediction, predictionMode])

  const calculateModeAccuracy = (mode: Mode) => {
    const { correct, total } = modeStats[mode]
    return total > 0 ? Math.round((correct / total) * 100) : 0
  }

  const handleDataDownload = () => {
    const data = {
      history,
      modeStats,
      toolPerformance,
    }
    const jsonString = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "dragon-tiger-predictor-data.json"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-zinc-900 p-4">
      <Card className="mx-auto w-full max-w-md md:max-w-lg lg:max-w-xl bg-zinc-800 text-white border-zinc-700">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold text-blue-400">Dragon Tiger Predictor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <h2 className="text-lg font-semibold">Enter Last 5 Results:</h2>
              <div className="flex justify-center gap-2 min-h-[40px]">
                {results.map((result, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className={`
                      ${result === "dragon" ? "bg-red-500" : ""}
                      ${result === "tiger" ? "bg-yellow-500" : ""}
                      ${result === "tie" ? "bg-purple-500" : ""}
                      text-white
                    `}
                  >
                    {result.toUpperCase()}
                  </Badge>
                ))}
              </div>
              <Badge variant="outline" className="bg-green-600">
                Prediction Mode: {predictionMode.toUpperCase()}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button
                className="bg-red-600 text-white font-bold"
                onClick={() => addResult("dragon")}
                disabled={results.length >= 5 || isProcessing}
              >
                DRAGON
              </Button>
              <Button
                className="bg-green-600 text-white font-bold"
                onClick={() => addResult("tiger")}
                disabled={results.length >= 5 || isProcessing}
              >
                TIGER
              </Button>
              <Button
                className="bg-yellow-600 text-white font-bold"
                onClick={() => addResult("tie")}
                disabled={results.length >= 5 || isProcessing}
              >
                TIE
              </Button>
            </div>
          </div>

          <Tabs defaultValue="mode" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="mode">Select Mode</TabsTrigger>
              <TabsTrigger value="input">Input Type</TabsTrigger>
            </TabsList>
            <TabsContent value="mode" className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                {["Normal", "Advanced", "Expert"].map((mode) => (
                  <TooltipProvider key={mode}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          className={`${predictionMode === mode ? "bg-blue-600 text-white" : "bg-zinc-700 text-white"}`}
                          onClick={() => setPredictionMode(mode as Mode)}
                        >
                          {mode}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {mode === "Normal"
                            ? "Basic prediction"
                            : mode === "Advanced"
                              ? "Improved accuracy"
                              : "Highest accuracy"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="input">
              <div className="grid grid-cols-2 gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className={`${inputMode === "automatic" ? "bg-blue-600 text-white" : "bg-zinc-700 text-white"}`}
                        onClick={() => setInputMode("automatic")}
                      >
                        Automatic
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Predict automatically after 5 inputs</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className={`${inputMode === "manual" ? "bg-blue-600 text-white" : "bg-zinc-700 text-white"}`}
                        onClick={() => setInputMode("manual")}
                      >
                        Manual
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Predict on demand</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </TabsContent>
          </Tabs>

          <Button
            className="w-full bg-blue-600 text-white font-bold"
            onClick={calculatePrediction}
            disabled={results.length < 5 || isProcessing}
          >
            <Target className="mr-2 h-4 w-4" />
            {isProcessing ? "Processing..." : "Get Prediction"}
          </Button>

          {prediction && (
            <Card className="bg-zinc-700 border-zinc-600">
              <CardContent className="pt-6">
                <p className="text-center text-xl font-bold text-green-400">Predicted Next: {prediction}</p>
              </CardContent>
            </Card>
          )}

          {prediction && userFeedback === null && (
            <div className="flex justify-center space-x-4">
              <Button onClick={() => setUserFeedback(true)} className="bg-green-600 text-white">
                Correct
              </Button>
              <Button onClick={() => setUserFeedback(false)} className="bg-red-600 text-white">
                Incorrect
              </Button>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              className="bg-zinc-700 text-white"
              onClick={backspace}
              disabled={results.length === 0 || isProcessing}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              variant="outline"
              className="bg-zinc-700 text-white"
              onClick={clear}
              disabled={results.length === 0 || isProcessing}
            >
              <Delete className="h-4 w-4 mr-2" />
              Clear
            </Button>
            <Button variant="outline" className="bg-zinc-700 text-white" onClick={reset} disabled={isProcessing}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>

          <Card className="bg-zinc-700 border-zinc-600">
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                Tool Performance
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Overall performance of the prediction tool</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Total Predictions: {toolPerformance.totalPredictions}</p>
              <p>Correct Predictions: {toolPerformance.correctPredictions}</p>
              <p>
                Accuracy:{" "}
                {toolPerformance.totalPredictions > 0
                  ? Math.round((toolPerformance.correctPredictions / toolPerformance.totalPredictions) * 100)
                  : 0}
                %
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-700 border-zinc-600">
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                Result History
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Past game results</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {history.map((result, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className={`
                        ${result === "dragon" ? "bg-red-500" : ""}
                        ${result === "tiger" ? "bg-yellow-500" : ""}
                        ${result === "tie" ? "bg-purple-500" : ""}
                      `}
                    >
                      {result.charAt(0).toUpperCase()}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">No results yet</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-zinc-700 border-zinc-600 mt-4">
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                Game Statistics
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Overall game statistics</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Total Games: {history.length}</p>
              <p>Dragon Wins: {history.filter((result) => result === "dragon").length}</p>
              <p>Tiger Wins: {history.filter((result) => result === "tiger").length}</p>
              <p>Ties: {history.filter((result) => result === "tie").length}</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-700 border-zinc-600 mt-4">
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                Mode Statistics
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Accuracy of each prediction mode</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Normal Mode Accuracy: {calculateModeAccuracy("Normal")}%</p>
              <p>Advanced Mode Accuracy: {calculateModeAccuracy("Advanced")}%</p>
              <p>Expert Mode Accuracy: {calculateModeAccuracy("Expert")}%</p>
            </CardContent>
          </Card>

          <Button className="w-full mt-4 bg-blue-600 text-white" onClick={handleDataDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download Data
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

