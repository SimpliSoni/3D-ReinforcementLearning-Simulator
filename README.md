# 3D-ReinforcementLearning-Simulator

An interactive, web-based simulator for visualizing reinforcement learning policies in 3D environments

-----

  * **Render 3D Environments**: Load and display different simulation environments, like a Grid World.
  * **Upload and Test Policies**: Users can upload pre-trained policy files (e.g., a Q-table in JSON format) to guide the agent.
  * **Control the Simulation**: Play, pause, step through, and reset the agent's interaction with the environment.
  * **Visualize Key Metrics**: Toggle visual aids like Q-values to better understand the agent's decision-making process at each step.

This tool is invaluable for students, researchers, and developers who need to bridge the gap between RL theory and practical application.

-----

## Built With

  * React
  * Three.js
  * WebGL

-----

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

You'll need Node.js and npm installed on your machine.

```bash
npm install npm@latest -g
```

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/SimpliSoni/3D-ReinforcementLearning-Simulator.git
    ```
2.  Navigate to the project directory:
    ```bash
    cd 3D-ReinforcementLearning-Simulator
    ```
3.  Install NPM packages:
    ```bash
    npm install
    ```
4.  Start the development server:
    ```bash
    npm start
    ```

Your browser should automatically open to `http://localhost:3000`.

-----

## Usage

Once the application is running, you can interact with the simulation using the control panel:

1.  **Select an Environment**: Use the dropdown menu to choose a simulation world (e.g., "Grid World").
2.  **Upload a Policy**: Click "**Choose File**" to upload a compatible policy file (e.g., a JSON file containing a Q-table).
3.  **Run the Simulation**: Use the "**Play**," "**Pause**," and "**Step**" buttons to observe the agent's behavior.
4.  **Analyze**: Toggle the "**Show Q-Values**" checkbox to visualize the agent's learned values for different actions in its current state.

This allows for a direct and intuitive analysis of how the trained policy performs in a 3D space.
