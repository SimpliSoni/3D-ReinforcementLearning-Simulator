"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import * as THREE from "three"
import { Play, Pause, RotateCcw, SkipForward, Upload, Settings, BarChart3, Eye, Grid3x3, Bot } from "lucide-react"
import Link from "next/link"

const RL3DSimulator = () => {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  const animationRef = useRef(null)
  const clockRef = useRef(new THREE.Clock())

  // Simulation state
  const [isRunning, setIsRunning] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [simulationSpeed, setSimulationSpeed] = useState(1)
  const [selectedEnvironment, setSelectedEnvironment] = useState("gridworld")
  const [agents, setAgents] = useState([])
  const [environment, setEnvironment] = useState(null)
  const [policy, setPolicy] = useState(null)
  const [metrics, setMetrics] = useState({ totalReward: 0, averageReward: 0, steps: 0 })

  // Visualization settings
  const [showQValues, setShowQValues] = useState(true)
  const [showTrajectories, setShowTrajectories] = useState(true)
  const [showRewards, setShowRewards] = useState(true)
  const [cameraMode, setCameraMode] = useState("orbital")

  // Sample Q-table for demonstration
  const sampleQTable = {
    type: "q_table",
    states: 16, // 4x4 grid
    actions: 4, // up, down, left, right
    values: [
      [0.1, 0.2, 0.3, 0.4],
      [0.2, 0.3, 0.4, 0.5],
      [0.3, 0.4, 0.5, 0.6],
      [0.4, 0.5, 0.6, 0.7],
      [0.5, 0.6, 0.7, 0.8],
      [0.6, 0.7, 0.8, 0.9],
      [0.7, 0.8, 0.9, 1.0],
      [0.8, 0.9, 1.0, 0.9],
      [0.9, 1.0, 0.9, 0.8],
      [1.0, 0.9, 0.8, 0.7],
      [0.9, 0.8, 0.7, 0.6],
      [0.8, 0.7, 0.6, 0.5],
      [0.7, 0.6, 0.5, 0.4],
      [0.6, 0.5, 0.4, 0.3],
      [0.5, 0.4, 0.3, 0.2],
      [0.4, 0.3, 0.2, 0.1],
    ],
  }

  // Environment definitions
  const environments = {
    gridworld: {
      name: "Grid World",
      size: { x: 4, y: 4 },
      obstacles: [
        [1, 1],
        [2, 2],
      ],
      goals: [[3, 3]],
      start: [0, 0],
    },
    maze: {
      name: "Maze Environment",
      size: { x: 6, y: 6 },
      obstacles: [
        [1, 1],
        [1, 2],
        [2, 1],
        [3, 3],
        [3, 4],
        [4, 3],
      ],
      goals: [[5, 5]],
      start: [0, 0],
    },
    multiagent: {
      name: "Multi-Agent Arena",
      size: { x: 8, y: 8 },
      obstacles: [
        [2, 2],
        [3, 3],
        [4, 4],
        [5, 5],
      ],
      goals: [
        [0, 7],
        [7, 0],
      ],
      start: [
        [0, 0],
        [7, 7],
      ],
    },
  }

  // Initialize Three.js scene
  const initializeScene = useCallback(() => {
    if (!mountRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a2e)
    sceneRef.current = scene

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000,
    )
    camera.position.set(5, 8, 5)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    mountRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(10, 10, 5)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    scene.add(directionalLight)

    // Grid helper
    const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x444444)
    scene.add(gridHelper)

    return { scene, camera, renderer }
  }, [])

  // Create environment visualization
  const createEnvironment = useCallback((envType) => {
    const scene = sceneRef.current
    if (!scene) return

    // Clear existing environment
    const existingEnv = scene.getObjectByName("environment")
    if (existingEnv) {
      scene.remove(existingEnv)
    }

    const envGroup = new THREE.Group()
    envGroup.name = "environment"
    const env = environments[envType]
    const { size, obstacles, goals, start } = env

    // Create floor
    const floorGeometry = new THREE.PlaneGeometry(size.x, size.y)
    const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a3e })
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.rotation.x = -Math.PI / 2
    floor.position.set(size.x / 2 - 0.5, 0, size.y / 2 - 0.5)
    floor.receiveShadow = true
    envGroup.add(floor)

    // Create obstacles
    obstacles.forEach(([x, y]) => {
      const obstacleGeometry = new THREE.BoxGeometry(0.8, 1, 0.8)
      const obstacleMaterial = new THREE.MeshLambertMaterial({ color: 0xff4444 })
      const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial)
      obstacle.position.set(x, 0.5, y)
      obstacle.castShadow = true
      envGroup.add(obstacle)
    })

    // Create goals
    goals.forEach(([x, y]) => {
      const goalGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1)
      const goalMaterial = new THREE.MeshLambertMaterial({ color: 0x44ff44 })
      const goal = new THREE.Mesh(goalGeometry, goalMaterial)
      goal.position.set(x, 0.05, y)
      envGroup.add(goal)

      // Add glow effect
      const glowGeometry = new THREE.RingGeometry(0.3, 0.6, 16)
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x44ff44,
        transparent: true,
        opacity: 0.3,
      })
      const glow = new THREE.Mesh(glowGeometry, glowMaterial)
      glow.rotation.x = -Math.PI / 2
      glow.position.set(x, 0.01, y)
      envGroup.add(glow)
    })

    scene.add(envGroup)
    return envGroup
  }, [])

  // Create agent visualization
  const createAgent = useCallback((position, id = 0) => {
    const agentGeometry = new THREE.SphereGeometry(0.2, 16, 16)
    const agentMaterial = new THREE.MeshLambertMaterial({
      color: id === 0 ? 0x4444ff : 0xff44ff,
    })
    const agent = new THREE.Mesh(agentGeometry, agentMaterial)
    agent.position.set(position[0], 0.2, position[1])
    agent.castShadow = true
    agent.name = `agent_${id}`

    // Add direction indicator
    const directionGeometry = new THREE.ConeGeometry(0.1, 0.3, 8)
    const directionMaterial = new THREE.MeshLambertMaterial({ color: 0xffff44 })
    const direction = new THREE.Mesh(directionGeometry, directionMaterial)
    direction.rotation.x = Math.PI / 2
    direction.position.set(0, 0, 0.25)
    agent.add(direction)

    return agent
  }, [])

  // Create Q-value visualization
  const createQValueVisualization = useCallback(() => {
    const scene = sceneRef.current
    if (!scene || !policy || !showQValues) return

    // Clear existing Q-value visualization
    const existingQViz = scene.getObjectByName("qvalues")
    if (existingQViz) {
      scene.remove(existingQViz)
    }

    const qGroup = new THREE.Group()
    qGroup.name = "qvalues"

    if (policy.type === "q_table") {
      const env = environments[selectedEnvironment]
      const { size } = env

      for (let x = 0; x < size.x; x++) {
        for (let y = 0; y < size.y; y++) {
          const stateIndex = y * size.x + x
          const qValues = policy.values[stateIndex]

          if (qValues) {
            const maxQ = Math.max(...qValues)
            const minQ = Math.min(...qValues)
            const range = maxQ - minQ

            // Create Q-value arrows for each action
            qValues.forEach((qValue, actionIndex) => {
              const intensity = range > 0 ? (qValue - minQ) / range : 0.5
              const color = new THREE.Color().setHSL(0.3 * intensity, 1, 0.5)

              const arrowGeometry = new THREE.ConeGeometry(0.05, 0.2, 6)
              const arrowMaterial = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.7,
              })
              const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial)

              // Position based on action (0: up, 1: down, 2: left, 3: right)
              const offsets = [
                [0, 0.1, -0.2],
                [0, 0.1, 0.2],
                [-0.2, 0.1, 0],
                [0.2, 0.1, 0],
              ]
              const rotations = [0, Math.PI, -Math.PI / 2, Math.PI / 2]

              arrow.position.set(x + offsets[actionIndex][0], offsets[actionIndex][1], y + offsets[actionIndex][2])
              arrow.rotation.z = rotations[actionIndex]
              qGroup.add(arrow)
            })
          }
        }
      }
    }

    scene.add(qGroup)
  }, [policy, selectedEnvironment, showQValues])

  // Animation loop
  const animate = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return

    const delta = clockRef.current.getDelta()

    // Update camera if in orbital mode
    if (cameraMode === "orbital") {
      const time = clockRef.current.getElapsedTime()
      cameraRef.current.position.x = Math.cos(time * 0.1) * 8
      cameraRef.current.position.z = Math.sin(time * 0.1) * 8
      cameraRef.current.lookAt(2, 0, 2)
    }

    // Simulation step
    if (isRunning) {
      const stepInterval = 1000 / simulationSpeed // Convert speed to milliseconds
      const now = Date.now()

      if (!animationRef.current.lastStep || now - animationRef.current.lastStep > stepInterval) {
        simulationStep()
        animationRef.current.lastStep = now
      }
    }

    rendererRef.current.render(sceneRef.current, cameraRef.current)
    animationRef.current.id = requestAnimationFrame(animate)
  }, [isRunning, simulationSpeed, cameraMode])

  // Simulation step logic
  const simulationStep = useCallback(() => {
    if (!policy || !environment) return

    const scene = sceneRef.current
    const agentMesh = scene.getObjectByName("agent_0")

    if (agentMesh) {
      // Simple random walk for demonstration
      const actions = [
        [0, -1],
        [0, 1],
        [-1, 0],
        [1, 0], // up, down, left, right
      ]

      const randomAction = Math.floor(Math.random() * actions.length)
      const [dx, dz] = actions[randomAction]

      const newX = Math.max(0, Math.min(environments[selectedEnvironment].size.x - 1, agentMesh.position.x + dx))
      const newZ = Math.max(0, Math.min(environments[selectedEnvironment].size.y - 1, agentMesh.position.z + dz))

      agentMesh.position.x = newX
      agentMesh.position.z = newZ

      // Rotate agent to face movement direction
      if (dx !== 0 || dz !== 0) {
        agentMesh.rotation.y = Math.atan2(dx, dz)
      }
    }

    setCurrentStep((prev) => prev + 1)
    setMetrics((prev) => ({
      ...prev,
      steps: prev.steps + 1,
      totalReward: prev.totalReward + (Math.random() - 0.5) * 10,
    }))
  }, [policy, environment, selectedEnvironment])

  // Initialize simulation
  const initializeSimulation = useCallback(() => {
    const scene = sceneRef.current
    if (!scene) return

    // Clear existing agents
    const existingAgents = scene.children.filter((child) => child.name && child.name.startsWith("agent_"))
    existingAgents.forEach((agent) => scene.remove(agent))

    // Create environment
    const env = createEnvironment(selectedEnvironment)

    // Create agents
    const envConfig = environments[selectedEnvironment]
    const startPositions = Array.isArray(envConfig.start[0]) ? envConfig.start : [envConfig.start]

    startPositions.forEach((position, index) => {
      const agent = createAgent(position, index)
      scene.add(agent)
    })

    // Set policy and environment
    setPolicy(sampleQTable)
    setEnvironment(envConfig)

    // Reset metrics
    setMetrics({ totalReward: 0, averageReward: 0, steps: 0 })
    setCurrentStep(0)
  }, [selectedEnvironment, createEnvironment, createAgent])

  // Control functions
  const handlePlay = () => setIsRunning(true)
  const handlePause = () => setIsRunning(false)
  const handleReset = () => {
    setIsRunning(false)
    setCurrentStep(0)
    initializeSimulation()
  }
  const handleStep = () => {
    setIsRunning(false)
    simulationStep()
  }

  // File upload handler
  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const uploadedPolicy = JSON.parse(e.target.result)
          setPolicy(uploadedPolicy)
          console.log("Policy uploaded:", uploadedPolicy)
        } catch (error) {
          console.error("Error parsing policy file:", error)
        }
      }
      reader.readAsText(file)
    }
  }

  // Effects
  useEffect(() => {
    initializeScene()
    animationRef.current = { lastStep: 0 }

    return () => {
      if (animationRef.current?.id) {
        cancelAnimationFrame(animationRef.current.id)
      }
      if (rendererRef.current) {
        rendererRef.current.dispose()
      }
    }
  }, [initializeScene])

  useEffect(() => {
    if (sceneRef.current) {
      initializeSimulation()
    }
  }, [selectedEnvironment, initializeSimulation])

  useEffect(() => {
    createQValueVisualization()
  }, [createQValueVisualization])

  useEffect(() => {
    animate()
    return () => {
      if (animationRef.current?.id) {
        cancelAnimationFrame(animationRef.current.id)
      }
    }
  }, [animate])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (mountRef.current && rendererRef.current && cameraRef.current) {
        const width = mountRef.current.clientWidth
        const height = mountRef.current.clientHeight

        cameraRef.current.aspect = width / height
        cameraRef.current.updateProjectionMatrix()
        rendererRef.current.setSize(width, height)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="w-6 h-6" />
            RL Simulator
          </h1>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              View Dashboard
            </Link>
            <div className="text-sm">
              <span className="text-gray-400">Step:</span> {currentStep} |
              <span className="text-gray-400 ml-2">Reward:</span> {metrics.totalReward.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Control Panel */}
        <div className="w-80 bg-gray-800 p-4 border-r border-gray-700 overflow-y-auto">
          {/* Simulation Controls */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Play className="w-5 h-5" />
              Simulation Controls
            </h3>
            <div className="flex gap-2 mb-4">
              <button
                onClick={handlePlay}
                disabled={isRunning}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-3 py-2 rounded flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Play
              </button>
              <button
                onClick={handlePause}
                disabled={!isRunning}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 px-3 py-2 rounded flex items-center justify-center gap-2"
              >
                <Pause className="w-4 h-4" />
                Pause
              </button>
            </div>
            <div className="flex gap-2 mb-4">
              <button
                onClick={handleStep}
                className="flex-1 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded flex items-center justify-center gap-2"
              >
                <SkipForward className="w-4 h-4" />
                Step
              </button>
              <button
                onClick={handleReset}
                className="flex-1 bg-red-600 hover:bg-red-700 px-3 py-2 rounded flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Speed: {simulationSpeed}x</label>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={simulationSpeed}
                onChange={(e) => setSimulationSpeed(Number.parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {/* Environment Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Grid3x3 className="w-5 h-5" />
              Environment
            </h3>
            <select
              value={selectedEnvironment}
              onChange={(e) => setSelectedEnvironment(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 mb-3"
            >
              {Object.entries(environments).map(([key, env]) => (
                <option key={key} value={key}>
                  {env.name}
                </option>
              ))}
            </select>
            <div className="text-sm text-gray-400">
              Size: {environments[selectedEnvironment].size.x}×{environments[selectedEnvironment].size.y}
            </div>
          </div>

          {/* Policy Upload */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Policy Upload
            </h3>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 mb-2"
            />
            <div className="text-sm text-gray-400">Upload Q-table or neural network weights in JSON format</div>
          </div>

          {/* Visualization Settings */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Visualization
            </h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showQValues}
                  onChange={(e) => setShowQValues(e.target.checked)}
                  className="rounded"
                />
                Show Q-Values
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showTrajectories}
                  onChange={(e) => setShowTrajectories(e.target.checked)}
                  className="rounded"
                />
                Show Trajectories
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showRewards}
                  onChange={(e) => setShowRewards(e.target.checked)}
                  className="rounded"
                />
                Show Rewards
              </label>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Camera Mode</label>
              <select
                value={cameraMode}
                onChange={(e) => setCameraMode(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
              >
                <option value="orbital">Orbital</option>
                <option value="fixed">Fixed</option>
                <option value="follow">Follow Agent</option>
              </select>
            </div>
          </div>

          {/* Metrics */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Metrics
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Steps:</span>
                <span>{metrics.steps}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Reward:</span>
                <span>{metrics.totalReward.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Avg Reward:</span>
                <span>{metrics.steps > 0 ? (metrics.totalReward / metrics.steps).toFixed(2) : "0.00"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3D Visualization */}
        <div className="flex-1 relative">
          <div ref={mountRef} className="w-full h-full" />

          {/* Overlay Controls */}
          <div className="absolute top-4 right-4 bg-gray-800 bg-opacity-90 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm">
              <Settings className="w-4 h-4" />
              <span>Controls: Mouse to rotate, Scroll to zoom</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RL3DSimulator
