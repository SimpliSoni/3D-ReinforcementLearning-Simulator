"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, TrendingUp, Target, Clock, Activity, BarChart3, PieChart, LineChart } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Mock data for demonstration - in a real app this would come from a shared state or API
const generateMockData = () => {
  const steps = Array.from({ length: 50 }, (_, i) => i + 1)
  const rewards = steps.map(() => Math.random() * 20 - 10)
  const cumulativeRewards = rewards.reduce((acc, reward, i) => {
    acc.push((acc[i - 1] || 0) + reward)
    return acc
  }, [])

  return {
    currentMetrics: {
      totalSteps: 1247,
      totalReward: 156.8,
      averageReward: 0.126,
      successRate: 78.5,
      episodeCount: 23,
      bestReward: 45.2,
    },
    rewardHistory: rewards.slice(-20),
    cumulativeRewards: cumulativeRewards.slice(-20),
    environmentStats: {
      gridworld: { episodes: 15, avgReward: 12.3, successRate: 85 },
      maze: { episodes: 5, avgReward: 8.7, successRate: 60 },
      multiagent: { episodes: 3, avgReward: 15.1, successRate: 90 },
    },
  }
}

const Dashboard = () => {
  const [data, setData] = useState(generateMockData())

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setData(generateMockData())
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const SimpleLineChart = ({ data, title, color = "#3b82f6" }) => {
    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min || 1

    return (
      <div className="h-32 flex items-end gap-1 p-2">
        {data.map((value, i) => {
          const height = ((value - min) / range) * 100
          return (
            <div
              key={i}
              className="flex-1 bg-blue-500 rounded-t opacity-70 hover:opacity-100 transition-opacity"
              style={{
                height: `${Math.max(height, 5)}%`,
                backgroundColor: color,
              }}
              title={`Step ${i + 1}: ${value.toFixed(2)}`}
            />
          )
        })}
      </div>
    )
  }

  const MetricCard = ({ title, value, subtitle, icon: Icon, trend }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
        {trend && (
          <div className={`text-xs flex items-center gap-1 mt-1 ${trend > 0 ? "text-green-600" : "text-red-600"}`}>
            <TrendingUp className="h-3 w-3" />
            {trend > 0 ? "+" : ""}
            {trend}%
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Simulator
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Learning Dashboard</h1>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Real-time AI Performance Analytics</div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Learning Steps"
            value={data.currentMetrics.totalSteps.toLocaleString()}
            subtitle="Actions taken by AI"
            icon={Clock}
            trend={12.5}
          />
          <MetricCard
            title="Success Rate"
            value={`${data.currentMetrics.successRate}%`}
            subtitle="Goals reached successfully"
            icon={Target}
            trend={5.2}
          />
          <MetricCard
            title="Learning Score"
            value={data.currentMetrics.totalReward.toFixed(1)}
            subtitle="Total points earned"
            icon={TrendingUp}
            trend={-2.1}
          />
          <MetricCard
            title="Training Episodes"
            value={data.currentMetrics.episodeCount}
            subtitle="Complete learning sessions"
            icon={Activity}
            trend={8.7}
          />
        </div>

        {/* Performance Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="w-5 h-5" />
                Recent Performance
              </CardTitle>
              <CardDescription>How well the AI performed in the last 20 steps</CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleLineChart data={data.rewardHistory} title="Reward per Step" color="#10b981" />
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Green bars show positive rewards (good moves), lower bars show mistakes
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Learning Progress
              </CardTitle>
              <CardDescription>Cumulative score showing overall improvement</CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleLineChart data={data.cumulativeRewards} title="Total Score Over Time" color="#3b82f6" />
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Upward trend indicates the AI is getting better at the task
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Environment Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Performance by Environment
            </CardTitle>
            <CardDescription>How the AI performs in different challenge types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(data.environmentStats).map(([env, stats]) => (
                <div key={env} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-semibold capitalize mb-2">
                    {env === "gridworld" ? "Grid World" : env === "multiagent" ? "Multi-Agent" : "Maze"}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Episodes:</span>
                      <span className="font-medium">{stats.episodes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Avg Score:</span>
                      <span className="font-medium">{stats.avgReward}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Success Rate:</span>
                      <span className={`font-medium ${stats.successRate > 70 ? "text-green-600" : "text-yellow-600"}`}>
                        {stats.successRate}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Insights */}
        <Card>
          <CardHeader>
            <CardTitle>AI Learning Insights</CardTitle>
            <CardDescription>What the data tells us about the AI's learning progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Learning Trend</h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  The AI is showing steady improvement with a {data.currentMetrics.successRate}% success rate. The
                  upward trend in cumulative rewards indicates effective learning.
                </p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">Best Performance</h4>
                <p className="text-sm text-green-800 dark:text-green-200">
                  Highest single reward achieved: {data.currentMetrics.bestReward}. The AI performs best in the
                  Multi-Agent environment with 90% success rate.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard
